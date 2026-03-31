import db from "../db.js";

export const createUserNotification = ({ userId, title, message, type = "info", meta = null }) => {
  if (!userId || !title || !message) {
    return;
  }

  db.query(
    `INSERT INTO user_notifications (user_id, type, title, message, meta)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, type, title, message, meta],
    (err) => {
      if (err) {
        console.error("⚠️ Notification write warning:", err.message);
      }
    }
  );
};
