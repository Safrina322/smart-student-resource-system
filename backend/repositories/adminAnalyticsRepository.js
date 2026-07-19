import { queryAsync } from "../db.js";

export const countPendingRequests = async () => {
  const rows = await queryAsync("SELECT COUNT(*) AS count FROM resource_requests WHERE status='pending'");
  return rows[0]?.count || 0;
};

export const countApprovalsLast7Days = async () => {
  const rows = await queryAsync(
    "SELECT COUNT(*) AS count FROM resource_requests WHERE status='approved' AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
  );
  return rows[0]?.count || 0;
};

export const countResourceOpensLast7Days = async () => {
  const rows = await queryAsync(
    "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type='resource_open' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
  );
  return rows[0]?.count || 0;
};

export const findTopSubject = async () => {
  const rows = await queryAsync(
    "SELECT subject, COUNT(*) AS count FROM courses WHERE subject IS NOT NULL AND subject != '' GROUP BY subject ORDER BY count DESC LIMIT 1"
  );
  return rows[0]?.subject || "N/A";
};

export const findTopResourceType = async () => {
  const rows = await queryAsync(
    "SELECT resource_type, COUNT(*) AS count FROM course_lessons GROUP BY resource_type ORDER BY count DESC LIMIT 1"
  );
  return rows[0]?.resource_type || "N/A";
};

export const findApprovalsByDay = (sinceDate) =>
  queryAsync(
    `SELECT DATE(updated_at) AS day, COUNT(*) AS count
     FROM resource_requests
     WHERE status='approved' AND updated_at >= ?
     GROUP BY DATE(updated_at)
     ORDER BY day ASC`,
    [sinceDate]
  );

export const findResourceOpensByDay = (sinceDate) =>
  queryAsync(
    `SELECT DATE(created_at) AS day, COUNT(*) AS count
     FROM analytics_events
     WHERE event_type='resource_open' AND created_at >= ?
     GROUP BY DATE(created_at)
     ORDER BY day ASC`,
    [sinceDate]
  );

export const findTopSubjects = (limit = 5) =>
  queryAsync(
    `SELECT subject, COUNT(*) AS count
     FROM courses
     WHERE subject IS NOT NULL AND subject != ''
     GROUP BY subject
     ORDER BY count DESC
     LIMIT ${Number(limit) || 5}`
  );

export const findReportHistory = (limit) =>
  queryAsync(
    `SELECT
      h.id, h.report_type, h.format, h.range_days, h.status,
      h.recipient_email, h.file_name, h.error_message, h.created_at,
      COALESCE(a.name, a.email, 'Admin') AS admin_name
    FROM report_generation_history h
    LEFT JOIN admin a ON a.id = h.admin_id
    ORDER BY h.created_at DESC
    LIMIT ?`,
    [limit]
  );

export const findScheduleByAdmin = async (adminId) => {
  const rows = await queryAsync(
    `SELECT id, frequency, time_of_day, range_days, recipient_email, is_active, next_run_at, last_run_at, last_error
     FROM report_schedules
     WHERE admin_id = ?
     ORDER BY created_at DESC`,
    [adminId]
  );
  return rows;
};

export const upsertSchedule = async (adminId, { frequency, timeOfDay, rangeDays, recipientEmail, isActive, nextRunAt }) => {
  const existing = await queryAsync("SELECT id FROM report_schedules WHERE admin_id = ? LIMIT 1", [
    adminId,
  ]);

  if (existing.length > 0) {
    await queryAsync(
      `UPDATE report_schedules
       SET frequency = ?, time_of_day = ?, range_days = ?, recipient_email = ?, is_active = ?, next_run_at = ?, last_error = NULL
       WHERE id = ?`,
      [frequency, timeOfDay, rangeDays, recipientEmail, isActive, nextRunAt, existing[0].id]
    );
    return { id: existing[0].id, created: false };
  }

  const inserted = await queryAsync(
    `INSERT INTO report_schedules
      (admin_id, frequency, time_of_day, range_days, recipient_email, is_active, next_run_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [adminId, frequency, timeOfDay, rangeDays, recipientEmail, isActive, nextRunAt]
  );
  return { id: inserted.insertId, created: true };
};

export const deleteSchedule = (scheduleId, adminId) =>
  queryAsync("DELETE FROM report_schedules WHERE id = ? AND admin_id = ?", [scheduleId, adminId]);
