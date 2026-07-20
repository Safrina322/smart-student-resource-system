import { queryAsync } from "../db.js";

export const findCached = async (resourceId, contentType) => {
  const rows = await queryAsync(
    `SELECT content_json FROM ai_content_cache WHERE resource_id = ? AND content_type = ?`,
    [resourceId, contentType]
  );
  if (!rows[0]) return null;
  return JSON.parse(rows[0].content_json);
};

export const saveCache = (resourceId, contentType, content) =>
  queryAsync(
    `INSERT INTO ai_content_cache (resource_id, content_type, content_json)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE content_json = VALUES(content_json), created_at = CURRENT_TIMESTAMP`,
    [resourceId, contentType, JSON.stringify(content)]
  );

export const findResourceById = async (resourceId) => {
  const rows = await queryAsync(
    `SELECT id, title, description, subject, department, tags, resource_type, resource_link
     FROM lecturer_resources WHERE id = ? AND status = 'approved'`,
    [resourceId]
  );
  return rows[0] || null;
};

export const findUserEngagementSubjects = async (userId) => {
  const rows = await queryAsync(
    `SELECT lr.subject, COUNT(*) AS weight
     FROM (
       SELECT resource_id FROM resource_bookmarks WHERE user_id = ?
       UNION ALL
       SELECT resource_id FROM resource_ratings WHERE user_id = ?
       UNION ALL
       SELECT resource_id FROM resource_comments WHERE user_id = ?
     ) engaged
     JOIN lecturer_resources lr ON lr.id = engaged.resource_id
     WHERE lr.subject IS NOT NULL AND lr.subject != ''
     GROUP BY lr.subject
     ORDER BY weight DESC
     LIMIT 5`,
    [userId, userId, userId]
  );
  return rows;
};

export const findCandidateResourcesBySubjects = async (subjects, excludeResourceIds, limit = 12) => {
  if (!subjects.length) {
    return queryAsync(
      `SELECT id, title, description, subject, department, resource_type, resource_link
       FROM lecturer_resources
       WHERE status = 'approved'
       ORDER BY created_at DESC
       LIMIT ?`,
      [limit]
    );
  }

  const placeholders = subjects.map(() => "?").join(", ");
  const excludeClause = excludeResourceIds.length
    ? `AND id NOT IN (${excludeResourceIds.map(() => "?").join(", ")})`
    : "";

  return queryAsync(
    `SELECT id, title, description, subject, department, resource_type, resource_link
     FROM lecturer_resources
     WHERE status = 'approved' AND subject IN (${placeholders}) ${excludeClause}
     ORDER BY created_at DESC
     LIMIT ?`,
    [...subjects, ...excludeResourceIds, limit]
  );
};

export const findUserBookmarkedResourceIds = async (userId) => {
  const rows = await queryAsync(`SELECT resource_id FROM resource_bookmarks WHERE user_id = ?`, [userId]);
  return rows.map((r) => r.resource_id);
};

export const findUserCourseTitles = async (userId) => {
  // No DISTINCT needed - user_learning_progress has a UNIQUE(user_id, course_id)
  // key, so this join already returns at most one row per course.
  const rows = await queryAsync(
    `SELECT c.title, c.subject
     FROM user_learning_progress ulp
     JOIN courses c ON c.id = ulp.course_id
     WHERE ulp.user_id = ?
     ORDER BY ulp.last_accessed_at DESC
     LIMIT 10`,
    [userId]
  );
  return rows;
};
