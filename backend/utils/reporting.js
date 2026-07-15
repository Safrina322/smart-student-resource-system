import db from "../db.js";

export const queryAsync = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows || []);
    });
  });

export const csvEscape = (value) => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/\"/g, '""')}"`;
  }
  return text;
};

export const toCsv = (rows) => rows.map((row) => row.map(csvEscape).join(",")).join("\n");

export const buildReportPayload = async ({ days = 30 }) => {
  const normalizedDays = Math.min(365, Math.max(1, Number(days) || 30));
  const sinceDate = new Date(Date.now() - normalizedDays * 24 * 60 * 60 * 1000);

  const [
    pendingRows,
    approvalsRows,
    opensRows,
    topSubjectsRows,
    requestTypeRows,
    approvalTrendRows,
    openTrendRows,
  ] = await Promise.all([
    queryAsync("SELECT COUNT(*) AS count FROM resource_requests WHERE status='pending'"),
    queryAsync(
      "SELECT COUNT(*) AS count FROM resource_requests WHERE status='approved' AND updated_at >= ?",
      [sinceDate]
    ),
    queryAsync(
      "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type='resource_open' AND created_at >= ?",
      [sinceDate]
    ),
    queryAsync(
      `SELECT subject, COUNT(*) AS count
       FROM courses
       WHERE subject IS NOT NULL AND subject != ''
       GROUP BY subject
       ORDER BY count DESC
       LIMIT 5`
    ),
    queryAsync(
      `SELECT type, COUNT(*) AS count
       FROM resource_requests
       WHERE type IS NOT NULL AND type != ''
       GROUP BY type
       ORDER BY count DESC
       LIMIT 5`
    ),
    queryAsync(
      `SELECT DATE(updated_at) AS day, COUNT(*) AS count
       FROM resource_requests
       WHERE status='approved' AND updated_at >= ?
       GROUP BY DATE(updated_at)
       ORDER BY day ASC`,
      [sinceDate]
    ),
    queryAsync(
      `SELECT DATE(created_at) AS day, COUNT(*) AS count
       FROM analytics_events
       WHERE event_type='resource_open' AND created_at >= ?
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      [sinceDate]
    ),
  ]);

  const generatedAt = new Date().toISOString();

  const summary = {
    generatedAt,
    windowDays: normalizedDays,
    pendingRequests: pendingRows[0]?.count || 0,
    approvalsInWindow: approvalsRows[0]?.count || 0,
    resourceOpensInWindow: opensRows[0]?.count || 0,
  };

  const topSubjects = (topSubjectsRows || []).map((row) => ({
    subject: row.subject,
    count: Number(row.count) || 0,
  }));

  const topRequestTypes = (requestTypeRows || []).map((row) => ({
    type: row.type,
    count: Number(row.count) || 0,
  }));

  const approvalsByDay = (approvalTrendRows || []).map((row) => ({
    day: new Date(row.day).toISOString().slice(0, 10),
    count: Number(row.count) || 0,
  }));

  const resourceOpensByDay = (openTrendRows || []).map((row) => ({
    day: new Date(row.day).toISOString().slice(0, 10),
    count: Number(row.count) || 0,
  }));

  return {
    summary,
    topSubjects,
    topRequestTypes,
    approvalsByDay,
    resourceOpensByDay,
  };
};

export const buildReportCsv = (payload) => {
  const { summary, topSubjects, topRequestTypes, approvalsByDay, resourceOpensByDay } = payload;

  const csvRows = [
    ["section", "key", "value"],
    ["summary", "generated_at", summary.generatedAt],
    ["summary", "window_days", summary.windowDays],
    ["summary", "pending_requests", summary.pendingRequests],
    ["summary", "approvals_in_window", summary.approvalsInWindow],
    ["summary", "resource_opens_in_window", summary.resourceOpensInWindow],
  ];

  topSubjects.forEach((item) => {
    csvRows.push(["top_subject", item.subject, item.count]);
  });

  topRequestTypes.forEach((item) => {
    csvRows.push(["top_request_type", item.type, item.count]);
  });

  approvalsByDay.forEach((item) => {
    csvRows.push(["approvals_by_day", item.day, item.count]);
  });

  resourceOpensByDay.forEach((item) => {
    csvRows.push(["resource_opens_by_day", item.day, item.count]);
  });

  return toCsv(csvRows);
};

export const insertReportHistory = async ({
  adminId,
  scheduleId = null,
  reportType = "analytics",
  format = "csv",
  rangeDays = 30,
  status = "success",
  recipientEmail = null,
  fileName = null,
  errorMessage = null,
}) => {
  const result = await queryAsync(
    `INSERT INTO report_generation_history
      (admin_id, schedule_id, report_type, format, range_days, status, recipient_email, file_name, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      adminId || null,
      scheduleId,
      reportType,
      format,
      rangeDays,
      status,
      recipientEmail,
      fileName,
      errorMessage,
    ]
  );

  return result.insertId || null;
};
