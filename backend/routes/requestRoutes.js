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
import db from "../db.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { title, subject, semester, type, message } = req.body;

     // basic validation
    if (!title || !subject || !semester || !type) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // 🔍 check duplicate request
    db.query(
      "SELECT id FROM resource_requests WHERE title=? AND subject=? AND semester=? AND type=? AND status='pending'",
      [title, subject, semester, type],
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
          "INSERT INTO resource_requests (title, subject, semester, type, message, status) VALUES (?, ?, ?, ?, ?, 'pending')",
          [title, subject, semester, type, message],
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
