import express from "express";
import db from "../db.js";

const router = express.Router();

// 🔒 PROTECTED ROUTE
router.get("/", (req, res) => {
  // First check if description column exists
  db.query(`SHOW COLUMNS FROM resources LIKE 'description'`, (checkErr, result) => {
    if (checkErr) {
      console.error("❌ Column check error:", checkErr.message);
      return res.status(500).json({ 
        message: "Database error",
        error: checkErr.message 
      });
    }

    // Build SQL query based on column existence
    let sql;
    if (result.length > 0) {
      // description column exists
      sql = `
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
    } else {
      // description column doesn't exist yet
      sql = `
        SELECT
          id,
          title,
          '' AS description,
          COALESCE(category, 'General') AS category,
          COALESCE(image_url, '') AS image_url,
          COALESCE(resource_link, '') AS resource_link,
          created_at
        FROM resources
        ORDER BY created_at DESC
        LIMIT 20
      `;
    }

    db.query(sql, (err, results) => {
      if (err) {
        console.error("❌ Resources query error:", err.message);
        console.error("SQL:", sql);
        return res.status(500).json({ 
          message: "Failed to fetch resources",
          error: err.message 
        });
      }
      
      console.log(`✅ Fetched ${results?.length || 0} resources for user`);
      res.json(results || []);
    });
  });
});

export default router;
