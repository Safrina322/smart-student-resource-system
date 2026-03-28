import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, "..", "images");
const lessonFilesDir = path.join(__dirname, "..", "lesson-files");

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

if (!fs.existsSync(lessonFilesDir)) {
  fs.mkdirSync(lessonFilesDir, { recursive: true });
}

/* ---------- Image storage config ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "resource_file") {
      cb(null, lessonFilesDir);
      return;
    }
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

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

    const image = imageFile.filename;
    const resolvedResourceUrl = resourceFile
      ? `/lesson-files/${resourceFile.filename}`
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

    const fileUrl = req.file ? `/lesson-files/${req.file.filename}` : "";
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
    res.json({ message: "Lesson deleted" });
  });
});

export default router;
