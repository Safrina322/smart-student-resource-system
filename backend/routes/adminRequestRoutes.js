import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import db from "../db.js";

const router = express.Router();

// GET all pending requests
router.get("/", adminAuth, (req, res) => {
  const sql = "SELECT * FROM resource_requests WHERE status='pending'";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ DB Error:", err);
      return res.status(500).json({ message: "DB error", error: err.message });
    }

    console.log("✅ Requests fetched:", results?.length || 0);
    res.json(results);
  });
});

/* APPROVE REQUEST */
router.put("/:id/approve", adminAuth, (req, res) => {
  const { id } = req.params;

  // First, get the request details
  db.query(
    "SELECT * FROM resource_requests WHERE id=?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "DB error" });

      if (results.length === 0) return res.status(404).json({ message: "Request not found" });

      const request = results[0];

      // Insert into courses
      db.query(
        "INSERT INTO courses (title, description, subject, level, duration, image) VALUES (?, ?, ?, ?, ?, ?)",
        [request.title, request.message, request.subject, request.semester, "N/A", "default.jpg"],
        (err) => {
          if (err) return res.status(500).json({ message: "DB error" });

          // Update request status
          db.query(
            "UPDATE resource_requests SET status='approved' WHERE id=?",
            [id],
            (err) => {
              if (err) return res.status(500).json({ message: "DB error" });

              res.json({ message: "Request approved and added to courses" });
            }
          );
        }
      );
    }
  );
});

/* REJECT REQUEST */
router.put("/:id/reject", adminAuth, (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE resource_requests SET status='rejected' WHERE id=?",
    [id],
    (err) => {
      if (err) return res.status(500).json({ message: "DB error" });

      res.json({ message: "Request rejected" });
    }
  );
});

export default router;
