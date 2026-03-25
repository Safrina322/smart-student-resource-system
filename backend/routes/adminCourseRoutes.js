import express from "express";
import multer from "multer";
import db from "../db.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

/* ---------- Image storage config ---------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
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
  upload.single("image"),
  (req, res) => {
    const { title, description, subject, level, duration } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image required" });
    }

    const image = req.file ? req.file.filename : null;


    const sql = `
      INSERT INTO courses
      (title, description, subject, level, duration, image)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
      sql,
      [title, description, subject, level, duration, image],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "DB Error" });
        }
        res.json({ message: "Course added successfully" });
      }
    );
  }
);

export default router;
