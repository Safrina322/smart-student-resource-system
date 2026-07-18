import { queryAsync } from "../db.js";

export const isBookmarked = async (resourceId, userId) => {
  const rows = await queryAsync(
    "SELECT id FROM resource_bookmarks WHERE resource_id = ? AND user_id = ?",
    [resourceId, userId]
  );
  return rows.length > 0;
};

export const add = (resourceId, userId) =>
  queryAsync(
    "INSERT IGNORE INTO resource_bookmarks (resource_id, user_id) VALUES (?, ?)",
    [resourceId, userId]
  );

export const remove = (resourceId, userId) =>
  queryAsync("DELETE FROM resource_bookmarks WHERE resource_id = ? AND user_id = ?", [
    resourceId,
    userId,
  ]);

export const findByUser = (userId) =>
  queryAsync(
    `SELECT lr.id, lr.title, lr.description, lr.subject, lr.resource_type, lr.resource_link,
            b.created_at AS bookmarked_at
     FROM resource_bookmarks b
     JOIN lecturer_resources lr ON lr.id = b.resource_id
     WHERE b.user_id = ? AND lr.status = 'approved'
     ORDER BY b.created_at DESC`,
    [userId]
  );
