import { queryAsync } from "../db.js";

export const findByResource = (resourceId) =>
  queryAsync(
    `SELECT c.id, c.resource_id, c.user_id, c.parent_comment_id, c.comment_text, c.created_at,
            u.username
     FROM resource_comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.resource_id = ?
     ORDER BY c.created_at ASC`,
    [resourceId]
  );

export const create = async ({ resourceId, userId, parentCommentId, commentText }) => {
  const result = await queryAsync(
    "INSERT INTO resource_comments (resource_id, user_id, parent_comment_id, comment_text) VALUES (?, ?, ?, ?)",
    [resourceId, userId, parentCommentId || null, commentText]
  );
  return result.insertId;
};

export const findById = async (id) => {
  const rows = await queryAsync("SELECT * FROM resource_comments WHERE id = ?", [id]);
  return rows[0] || null;
};

export const remove = (id) => queryAsync("DELETE FROM resource_comments WHERE id = ?", [id]);
