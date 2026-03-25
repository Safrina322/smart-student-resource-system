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

export default router;
