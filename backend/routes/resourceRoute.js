import express from "express";
import db from "../db.js";

const router = express.Router();

// 🔒 PROTECTED ROUTE
router.get("/", (req, res) => {
  const sql = `
    SELECT
      id,
      title,
      COALESCE(description, '') AS description,
      COALESCE(category, 'General') AS category,
      COALESCE(image_url, '') AS image_url,
      COALESCE(resource_link, '') AS resource_link,
      created_at
    FROM resources
    ORDER BY created_at DESC
    LIMIT 20
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Resources query error:", err.message);
      return res.status(500).json({
        message: "Failed to fetch resources",
        error: err.message,
      });
    }

    res.json(results || []);
  });
});

export default router;
