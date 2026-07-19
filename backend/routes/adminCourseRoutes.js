import express from "express";
import multer from "multer";
import CloudinaryStorage from "multer-storage-cloudinary";
import { cloudinaryPkg } from "../utils/cloudinary.js";
import adminAuth from "../middleware/adminAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as adminCourseController from "../controllers/adminCourseController.js";

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

router.post(
  "/add",
  adminAuth,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "resource_file", maxCount: 1 },
  ]),
  asyncHandler(adminCourseController.addCourse)
);

router.post(
  "/:courseId/lessons",
  adminAuth,
  upload.single("resource_file"),
  asyncHandler(adminCourseController.addLesson)
);

router.get("/:courseId/lessons", adminAuth, asyncHandler(adminCourseController.getLessons));
router.put("/lessons/:lessonId", adminAuth, asyncHandler(adminCourseController.updateLesson));
router.delete("/lessons/:lessonId", adminAuth, asyncHandler(adminCourseController.deleteLesson));

export default router;
