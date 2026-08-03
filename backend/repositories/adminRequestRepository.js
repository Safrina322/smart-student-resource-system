import { queryAsync } from "../db.js";

export const findPending = async ({ page, pageSize }) => {
  const offset = (page - 1) * pageSize;
  const [rows, countRows] = await Promise.all([
    queryAsync(
      "SELECT * FROM resource_requests WHERE status='pending' ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [pageSize, offset]
    ),
    queryAsync("SELECT COUNT(*) AS count FROM resource_requests WHERE status='pending'"),
  ]);
  return { rows, total: countRows[0]?.count || 0 };
};

export const findWithUserById = async (id) => {
  const rows = await queryAsync(
    `SELECT rr.*, u.email AS user_email, u.username AS username,
            u.email_notifications_enabled AS user_email_notifications_enabled
     FROM resource_requests rr
     LEFT JOIN users u ON rr.user_id = u.id
     WHERE rr.id = ?`,
    [id]
  );
  return rows[0] || null;
};

export const findCourseByTitleAndSubject = async (title, subject) => {
  const rows = await queryAsync(
    "SELECT id FROM courses WHERE title = ? AND subject = ? LIMIT 1",
    [title, subject]
  );
  return rows[0] || null;
};

export const findCourseByTitle = async (title) => {
  const rows = await queryAsync("SELECT id FROM courses WHERE title = ? LIMIT 1", [title]);
  return rows[0] || null;
};

export const createCourse = async ({ title, description, subject, level, duration, image }) => {
  const result = await queryAsync(
    "INSERT INTO courses (title, description, subject, level, duration, image) VALUES (?, ?, ?, ?, ?, ?)",
    [title, description, subject, level, duration, image]
  );
  return result.insertId;
};

export const createLesson = ({
  courseId,
  lessonTitle,
  lessonDescription,
  resourceType,
  resourceUrl,
  lessonOrder,
}) =>
  queryAsync(
    `INSERT INTO course_lessons
     (course_id, lesson_title, lesson_description, resource_type, resource_url, lesson_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [courseId, lessonTitle, lessonDescription, resourceType, resourceUrl, lessonOrder]
  );

export const markApproved = (requestId, courseId) =>
  queryAsync("UPDATE resource_requests SET status='approved', course_id=? WHERE id=?", [
    courseId,
    requestId,
  ]);

export const markRejected = (requestId) =>
  queryAsync("UPDATE resource_requests SET status='rejected' WHERE id=?", [requestId]);

// Fire-and-forget by design, matching the original: a history-log write
// failing should never block or fail the approve/reject action itself.
export const addHistoryEntry = ({ requestId, status, note = null, adminId = null }) => {
  queryAsync(
    `INSERT INTO request_status_history (request_id, status, note, changed_by_admin_id)
     VALUES (?, ?, ?, ?)`,
    [requestId, status, note, adminId]
  ).catch((err) => {
    console.error("⚠️ Request history write warning:", err.message);
  });
};
