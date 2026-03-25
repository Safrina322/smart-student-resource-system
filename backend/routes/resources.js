const express = require("express");
const router = express.Router();
const db = require("../db");

// GET resources
router.get("/", (req, res) => {
  const sql = "SELECT * FROM resources ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// POST resource
router.post("/", (req, res) => {
  const { title, description, category, image_url, resource_link } = req.body;

  const sql = `
    INSERT INTO resources 
    (title, description, category, image_url, resource_link)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [title, description, category, image_url, resource_link],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Resource added successfully" });
    }
  );
});

module.exports = router;
