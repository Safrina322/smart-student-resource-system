import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import db from "../db.js";

const router = express.Router();

router.get("/logs", adminAuth, (req, res) => {
  db.query(
    `SELECT
      l.id,
      l.admin_id,
      a.name AS admin_name,
      a.email AS admin_email,
      l.action_type,
      l.target_type,
      l.target_id,
      l.details,
      l.created_at
     FROM admin_audit_logs l
     LEFT JOIN admin a ON a.id = l.admin_id
     ORDER BY l.created_at DESC
     LIMIT 100`,
    (err, rows) => {
      if (err) {
        console.error("❌ Audit logs query error:", err.message);
        return res.status(500).json({ message: "Failed to fetch audit logs" });
      }

      return res.json({ logs: rows });
    }
  );
});

export default router;
