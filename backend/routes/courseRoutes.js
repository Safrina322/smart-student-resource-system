import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
  const sql = "SELECT * FROM courses ORDER BY created_at DESC";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

router.get("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM courses WHERE id = ? LIMIT 1";

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    if (!results.length) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(results[0]);
  });
});

router.get("/:id/lessons", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM course_lessons WHERE course_id = ? ORDER BY lesson_order ASC, created_at ASC";

  db.query(sql, [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

export default router;
