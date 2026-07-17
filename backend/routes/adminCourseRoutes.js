import express from "express";
import multer from "multer";
import CloudinaryStorage from "multer-storage-cloudinary";
import { cloudinaryPkg } from "../utils/cloudinary.js";
import db from "../db.js";
import adminAuth from "../middleware/adminAuth.js";
import { logAdminAction } from "../utils/auditLogger.js";

const router = express.Router();

/* ---------- Cloudinary storage config ---------- */
// One shared storage instance for both fields in the "add course" form;
// which Cloudinary folder a file lands in depends on which field it came
// through (course cover image vs. the first lesson's resource file).
const storage = new CloudinaryStorage({
  cloudinary: cloudinaryPkg,
  // multer-storage-cloudinary calls this Node-callback style (req, file, cb)
  // internally via run-parallel, not as a function that returns a value -
  // omitting cb() here would hang every upload waiting for a callback that
  // never fires.
  params: (req, file, cb) => {
    cb(null, {
      folder:
        file.fieldname === "resource_file"
          ? "smartstudent/lesson-files"
          : "smartstudent/course-images",
      resource_type: "auto",
    });
  },
});

const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } });

/* ---------- Add Course API ---------- */
router.post(
  "/add",
  adminAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "resource_file", maxCount: 1 },
  ]),
  (req, res) => {
    const {
      title,
      description,
      subject,
      level,
      duration,
      lesson_title,
      lesson_description,
      resource_type,
      resource_url,
      lesson_order,
    } = req.body;

    const imageFile = req.files?.image?.[0] || null;
    const resourceFile = req.files?.resource_file?.[0] || null;

    if (!imageFile) {
      return res.status(400).json({ message: "Image required" });
    }

    const image = imageFile.secure_url; // Cloudinary secure_url
    const resolvedResourceUrl = resourceFile
      ? resourceFile.secure_url // Cloudinary secure_url
      : (resource_url || "");

    if (!lesson_title || !resource_type || !resolvedResourceUrl) {
      return res.status(400).json({ message: "Lesson title, type and URL/file are required" });
    }


    const sql = `
      INSERT INTO courses
      (title, description, subject, level, duration, image)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [title, description, subject, level, duration, image], (err, courseResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "DB Error" });
      }

      const newCourseId = courseResult.insertId;

      db.query(
        `INSERT INTO course_lessons
        (course_id, lesson_title, lesson_description, resource_type, resource_url, lesson_order)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newCourseId,
          lesson_title,
          lesson_description || "",
          resource_type,
          resolvedResourceUrl,
          Number(lesson_order) || 1,
        ],
        (lessonErr) => {
          if (lessonErr) {
            console.error(lessonErr);
            return res.status(500).json({ message: "Course created, but lesson save failed" });
          }

          logAdminAction({
            adminId: req.admin?.adminId || null,
            actionType: "course_created",
            targetType: "course",
            targetId: newCourseId,
            details: `Created course \"${title}\" with first lesson \"${lesson_title}\"`,
          });

          res.json({ message: "Course and lesson added successfully", courseId: newCourseId });
        }
      );
    });
  }
);

router.post(
  "/:courseId/lessons",
  adminAuth,
  upload.single("resource_file"),
  (req, res) => {
    const { courseId } = req.params;
    const {
      lesson_title,
      lesson_description,
      resource_type,
      resource_url,
      lesson_order,
    } = req.body;

    const fileUrl = req.file ? req.file.secure_url : ""; // Cloudinary secure_url
    const finalUrl = fileUrl || (resource_url || "");

    if (!lesson_title || !resource_type || !finalUrl) {
      return res.status(400).json({ message: "Lesson title, type and URL/file are required" });
    }

    db.query(
      `INSERT INTO course_lessons
      (course_id, lesson_title, lesson_description, resource_type, resource_url, lesson_order)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        courseId,
        lesson_title,
        lesson_description || "",
        resource_type,
        finalUrl,
        Number(lesson_order) || 1,
      ],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "DB Error" });
        }

        logAdminAction({
          adminId: req.admin?.adminId || null,
          actionType: "lesson_created",
          targetType: "course_lesson",
          targetId: result.insertId,
          details: `Added lesson \"${lesson_title}\" to course ${courseId}`,
        });

        res.json({ message: "Lesson added", lessonId: result.insertId });
      }
    );
  }
);

router.get("/:courseId/lessons", adminAuth, (req, res) => {
  const { courseId } = req.params;

  db.query(
    "SELECT * FROM course_lessons WHERE course_id = ? ORDER BY lesson_order ASC, created_at ASC",
    [courseId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ message: "DB Error" });
      }
      res.json(results);
    }
  );
});

router.put("/lessons/:lessonId", adminAuth, (req, res) => {
  const { lessonId } = req.params;
  const {
    lesson_title,
    lesson_description,
    resource_type,
    resource_url,
    lesson_order,
  } = req.body;

  db.query(
    `UPDATE course_lessons
     SET lesson_title = ?, lesson_description = ?, resource_type = ?, resource_url = ?, lesson_order = ?
     WHERE id = ?`,
    [
      lesson_title,
      lesson_description || "",
      resource_type,
      resource_url,
      Number(lesson_order) || 1,
      lessonId,
    ],
    (err) => {
      if (err) {
        return res.status(500).json({ message: "DB Error" });
      }

      logAdminAction({
        adminId: req.admin?.adminId || null,
        actionType: "lesson_updated",
        targetType: "course_lesson",
        targetId: Number(lessonId),
        details: `Updated lesson ${lessonId} to \"${lesson_title}\"`,
      });

      res.json({ message: "Lesson updated" });
    }
  );
});

router.delete("/lessons/:lessonId", adminAuth, (req, res) => {
  const { lessonId } = req.params;

  db.query("DELETE FROM course_lessons WHERE id = ?", [lessonId], (err) => {
    if (err) {
      return res.status(500).json({ message: "DB Error" });
    }

    logAdminAction({
      adminId: req.admin?.adminId || null,
      actionType: "lesson_deleted",
      targetType: "course_lesson",
      targetId: Number(lessonId),
      details: `Deleted lesson ${lessonId}`,
    });

    res.json({ message: "Lesson deleted" });
  });
});

export default router;
