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

const addRequestHistoryEntry = ({ requestId, status, note = null, adminId = null }) => {
  db.query(
    `INSERT INTO request_status_history (request_id, status, note, changed_by_admin_id)
     VALUES (?, ?, ?, ?)`,
    [requestId, status, note, adminId],
    (historyErr) => {
      if (historyErr) {
        console.error("⚠️ Request history write warning:", historyErr.message);
      }
    }
  );
};

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
          (err, insertResult) => {
            if (err) {
              console.error(err);
              return res.status(500).json({ message: "Server error" });
            }

            addRequestHistoryEntry({
              requestId: insertResult.insertId,
              status: "submitted",
              note: "Request submitted by student",
            });

            addRequestHistoryEntry({
              requestId: insertResult.insertId,
              status: "pending",
              note: "Request is under admin review",
            });

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

router.get("/mine", authMiddleware, (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  db.query(
    `SELECT
      rr.id,
      rr.title,
      rr.subject,
      rr.semester,
      rr.type,
      rr.status,
      rr.message,
      rr.created_at,
      rr.updated_at,
      rr.course_id,
      c.title AS course_title
    FROM resource_requests rr
    LEFT JOIN courses c ON c.id = rr.course_id
    WHERE rr.user_id = ?
    ORDER BY rr.created_at DESC`,
    [userId],
    (reqErr, requestRows) => {
      if (reqErr) {
        console.error("❌ Request timeline query error:", reqErr.message);
        return res.status(500).json({ message: "Failed to fetch your requests" });
      }

      if (!requestRows.length) {
        return res.json({ requests: [] });
      }

      const requestIds = requestRows.map((item) => item.id);

      db.query(
        `SELECT
          h.id,
          h.request_id,
          h.status,
          h.note,
          h.changed_by_admin_id,
          h.changed_at
        FROM request_status_history h
        WHERE h.request_id IN (?)
        ORDER BY h.changed_at ASC`,
        [requestIds],
        (historyErr, historyRows) => {
          if (historyErr) {
            console.error("❌ Request history query error:", historyErr.message);
            return res.status(500).json({ message: "Failed to fetch request history" });
          }

          const historyByRequestId = historyRows.reduce((acc, entry) => {
            if (!acc[entry.request_id]) {
              acc[entry.request_id] = [];
            }
            acc[entry.request_id].push(entry);
            return acc;
          }, {});

          const requests = requestRows.map((requestItem) => ({
            ...requestItem,
            timeline: historyByRequestId[requestItem.id] || [],
          }));

          return res.json({ requests });
        }
      );
    }
  );
});

export default router;
