import { queryAsync } from "../db.js";

export const findByUser = (userId) =>
  queryAsync(
    `SELECT id, type, title, message, meta, is_read, created_at, read_at
     FROM user_notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 30`,
    [userId]
  );

export const create = async ({ userId, title, message, type = "info", meta = null }) => {
  const result = await queryAsync(
    `INSERT INTO user_notifications (user_id, type, title, message, meta)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, type, title, message, meta]
  );
  const rows = await queryAsync("SELECT * FROM user_notifications WHERE id = ?", [result.insertId]);
  return rows[0];
};

export const markRead = (id, userId) =>
  queryAsync(
    "UPDATE user_notifications SET is_read = 1, read_at = NOW() WHERE id = ? AND user_id = ?",
    [id, userId]
  );

export const markAllRead = (userId) =>
  queryAsync(
    "UPDATE user_notifications SET is_read = 1, read_at = NOW() WHERE user_id = ? AND is_read = 0",
    [userId]
  );
