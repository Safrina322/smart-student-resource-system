import { queryAsync } from "../db.js";

export const create = ({ userId, eventType, courseId, lessonId, resourceType, metadata }) =>
  queryAsync(
    `INSERT INTO analytics_events (user_id, event_type, course_id, lesson_id, resource_type, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId || null, eventType, courseId || null, lessonId || null, resourceType || null, metadata]
  );
