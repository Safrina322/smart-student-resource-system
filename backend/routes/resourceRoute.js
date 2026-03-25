import express from "express";
import db from "../db.js";
import authMiddleware from "../middleware/authMiddleware.js"; // ✅ ADD THIS

const router = express.Router();

// 🔒 PROTECTED ROUTE
router.get("/", authMiddleware, (req, res) => {
  const sql = "SELECT * FROM resources ORDER BY created_at DESC LIMIT 5";

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

export default router;
