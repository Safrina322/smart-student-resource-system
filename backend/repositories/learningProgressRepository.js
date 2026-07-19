import { queryAsync } from "../db.js";

export const trackAccess = (userId, courseId, lessonId) =>
  queryAsync(
    `INSERT INTO user_learning_progress (user_id, course_id, lesson_id, last_accessed_at, created_at)
     VALUES (?, ?, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE
     lesson_id = COALESCE(?, lesson_id),
     last_accessed_at = NOW()`,
    [userId, courseId, lessonId, lessonId]
  );

export const findLastAccessed = async (userId) => {
  const rows = await queryAsync(
    `SELECT
      ulp.id,
      ulp.course_id,
      ulp.lesson_id,
      ulp.last_accessed_at,
      c.title as course_title,
      c.subject,
      c.image,
      cl.lesson_title,
      cl.id as current_lesson_id
    FROM user_learning_progress ulp
    JOIN courses c ON ulp.course_id = c.id
    LEFT JOIN course_lessons cl ON cl.id = ulp.lesson_id
    WHERE ulp.user_id = ?
    ORDER BY ulp.last_accessed_at DESC
    LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
};

export const findRecentActivity = (userId) =>
  queryAsync(
    `SELECT
      ae.id,
      ae.course_id,
      ae.lesson_id,
      ae.resource_type,
      ae.created_at,
      c.title as course_title,
      cl.lesson_title
    FROM analytics_events ae
    JOIN courses c ON ae.course_id = c.id
    LEFT JOIN course_lessons cl ON cl.id = ae.lesson_id
    WHERE ae.user_id = ?
    AND ae.event_type = 'resource_open'
    ORDER BY ae.created_at DESC
    LIMIT 5`,
    [userId]
  );
