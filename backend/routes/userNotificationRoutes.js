import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  db.query(
    `SELECT id, type, title, message, meta, is_read, created_at, read_at
     FROM user_notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 30`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error("❌ Notifications query error:", err.message);
        return res.status(500).json({ message: "Failed to fetch notifications" });
      }

      const unreadCount = rows.filter((item) => !item.is_read).length;
      return res.json({ notifications: rows, unreadCount });
    }
  );
});

router.patch("/:id/read", authMiddleware, (req, res) => {
  const userId = req.user?.id;
  const notificationId = Number(req.params.id);

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  db.query(
    `UPDATE user_notifications
     SET is_read = 1, read_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId],
    (err) => {
      if (err) {
        console.error("❌ Notification update error:", err.message);
        return res.status(500).json({ message: "Failed to mark notification as read" });
      }

      return res.json({ message: "Notification marked as read" });
    }
  );
});

router.patch("/read-all", authMiddleware, (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  db.query(
    `UPDATE user_notifications
     SET is_read = 1, read_at = NOW()
     WHERE user_id = ? AND is_read = 0`,
    [userId],
    (err) => {
      if (err) {
        console.error("❌ Notification bulk update error:", err.message);
        return res.status(500).json({ message: "Failed to mark all notifications as read" });
      }

      return res.json({ message: "All notifications marked as read" });
    }
  );
});

export default router;
