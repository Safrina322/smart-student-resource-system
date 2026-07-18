import { queryAsync } from "../db.js";

export const upsert = (resourceId, userId, rating) =>
  queryAsync(
    `INSERT INTO resource_ratings (resource_id, user_id, rating)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
    [resourceId, userId, rating]
  );

export const findUserRating = async (resourceId, userId) => {
  const rows = await queryAsync(
    "SELECT rating FROM resource_ratings WHERE resource_id = ? AND user_id = ?",
    [resourceId, userId]
  );
  return rows[0]?.rating ?? null;
};

export const summaryByResource = async (resourceId) => {
  const rows = await queryAsync(
    "SELECT COALESCE(AVG(rating), 0) AS average, COUNT(*) AS count FROM resource_ratings WHERE resource_id = ?",
    [resourceId]
  );
  return rows[0] || { average: 0, count: 0 };
};
