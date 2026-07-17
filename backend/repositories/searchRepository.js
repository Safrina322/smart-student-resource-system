import { queryAsync } from "../db.js";

const LIMIT_PER_SOURCE = 8;

export const searchResources = (like) =>
  queryAsync(
    `SELECT id, title, description, category AS subtitle, resource_link AS link
     FROM resources
     WHERE title LIKE ? OR description LIKE ? OR category LIKE ?
     ORDER BY created_at DESC
     LIMIT ${LIMIT_PER_SOURCE}`,
    [like, like, like]
  );

export const searchCourses = (like) =>
  queryAsync(
    `SELECT id, title, description, subject AS subtitle
     FROM courses
     WHERE is_active = TRUE AND (title LIKE ? OR subject LIKE ? OR description LIKE ?)
     ORDER BY created_at DESC
     LIMIT ${LIMIT_PER_SOURCE}`,
    [like, like, like]
  );

export const searchLecturerResources = (like) =>
  queryAsync(
    `SELECT id, title, description, subject AS subtitle, resource_link AS link
     FROM lecturer_resources
     WHERE status = 'approved' AND (title LIKE ? OR description LIKE ? OR subject LIKE ? OR tags LIKE ?)
     ORDER BY created_at DESC
     LIMIT ${LIMIT_PER_SOURCE}`,
    [like, like, like, like]
  );

export const logQuery = (query, userId) =>
  queryAsync("INSERT INTO search_logs (query, user_id) VALUES (?, ?)", [query, userId || null]);

export const getPopularQueries = (limit = 5) =>
  queryAsync(
    `SELECT query, COUNT(*) AS count
     FROM search_logs
     WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY query
     ORDER BY count DESC
     LIMIT ${Number(limit) || 5}`
  );
