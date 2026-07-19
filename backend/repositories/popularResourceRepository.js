import { queryAsync } from "../db.js";

export const findPopularCourses = () =>
  queryAsync(
    `SELECT
      c.id,
      c.title,
      c.subject,
      c.level,
      c.image,
      c.description,
      COUNT(DISTINCT ae.id) as total_views,
      COUNT(DISTINCT ae.user_id) as unique_users,
      (COUNT(DISTINCT ae.id) * 1.0 + COUNT(DISTINCT rr.id) * 2.5) as popularity_score
    FROM courses c
    LEFT JOIN analytics_events ae ON c.id = ae.course_id
      AND ae.event_type IN ('resource_open', 'course_access')
    LEFT JOIN resource_requests rr ON c.id = rr.course_id
      AND rr.status IN ('approved', 'pending')
    GROUP BY c.id, c.title, c.subject, c.level, c.image, c.description
    HAVING popularity_score > 0
    ORDER BY popularity_score DESC, total_views DESC
    LIMIT 10`
  );

export const findPopularLessons = (courseId) =>
  queryAsync(
    `SELECT
      cl.id,
      cl.lesson_title,
      cl.lesson_description,
      cl.resource_type,
      cl.lesson_order,
      COUNT(DISTINCT ae.id) as view_count,
      COUNT(DISTINCT ae.user_id) as unique_users
    FROM course_lessons cl
    LEFT JOIN analytics_events ae ON cl.id = ae.lesson_id
      AND ae.event_type = 'resource_open'
      AND ae.course_id = ?
    WHERE cl.course_id = ?
    GROUP BY cl.id, cl.lesson_title, cl.lesson_description, cl.resource_type, cl.lesson_order
    ORDER BY view_count DESC, cl.lesson_order ASC
    LIMIT 5`,
    [courseId, courseId]
  );

export const findTrending = () =>
  queryAsync(
    `SELECT
      c.id,
      c.title,
      c.subject,
      c.image,
      COUNT(DISTINCT ae.id) as recent_views,
      COUNT(DISTINCT ae.user_id) as unique_users,
      MAX(ae.created_at) as last_accessed
    FROM courses c
    LEFT JOIN analytics_events ae ON c.id = ae.course_id
      AND ae.event_type IN ('resource_open', 'course_access')
      AND ae.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    WHERE c.id IN (
      SELECT DISTINCT course_id FROM analytics_events
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    )
    GROUP BY c.id, c.title, c.subject, c.image
    ORDER BY recent_views DESC
    LIMIT 6`
  );
