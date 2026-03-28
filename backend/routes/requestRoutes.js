// import express from "express";
// import db from "../db.js";


// const existing = await db.query(
//   "SELECT id FROM resource_requests WHERE title=? AND subject=? AND semester=? AND status='pending'",
//   [title, subject, semester]
// );

// if (existing[0].length > 0) {
//   return res.status(400).json({ message: "Request already exists" });
// }


// const router = express.Router();

// router.post("/", async (req, res) => {
//   try {
//     const { title, subject, semester, type, message } = req.body;

//     if (!title || !subject || !semester || !type) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const sql = `
//       INSERT INTO resource_requests
//       (title, subject, semester, type, message, status)
//       VALUES (?, ?, ?, ?, ?, 'pending')
//     `;

//     db.query(
//       sql,
//       [title, subject, semester, type, message],
//       (err) => {
//         if (err) {
//           console.error("❌ DB ERROR:", err);
//           return res.status(500).json({ message: "Database error" });
//         }

//         res.json({ message: "Request submitted successfully" });
//       }
//     );
//   } catch (error) {
//     console.error("❌ SERVER ERROR:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });
// export default router;

import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, "..", "images");

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      semester,
      level,
      duration,
      type,
      message,
      lesson_title,
      lesson_description,
      resource_url,
      lesson_order,
    } = req.body;
    const image = req.file ? req.file.filename : "";
    const userId = req.user?.id;
    const semesterNumber = Number.parseInt(String(semester).replace(/[^0-9]/g, ""), 10);

     // basic validation
    if (!title || !subject || !semester || !type || !resource_url || !lesson_title) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (!Number.isInteger(semesterNumber) || semesterNumber <= 0) {
      return res.status(400).json({ message: "Semester must be a valid number" });
    }

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // 🔍 check duplicate request
    db.query(
      "SELECT id FROM resource_requests WHERE title=? AND subject=? AND semester=? AND type=? AND status='pending'",
      [title, subject, semesterNumber, type],
      (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Server error" });
        }

        if (result.length > 0) {
          return res.status(400).json({
            message: "Request already exists",
          });
        }

        // ✅ insert request
        db.query(
          `INSERT INTO resource_requests
          (user_id, title, description, subject, semester, level, duration, type, message, image, lesson_title, lesson_description, resource_url, lesson_order, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [
            userId,
            title,
            description || "",
            subject,
            semesterNumber,
            level || "Beginner",
            duration || "Self-paced",
            type,
            message || "",
            image,
            lesson_title,
            lesson_description || "",
            resource_url,
            Number(lesson_order) || 1,
          ],
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Server error" });
            }

            res.json({ message: "Request submitted successfully" });
          }
        );
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
