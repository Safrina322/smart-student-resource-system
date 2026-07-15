import express from "express";
import db from "../db.js";
import adminAuth from "../middleware/adminAuth.js";
import {
  queryAsync,
  buildReportPayload,
  buildReportCsv,
  insertReportHistory,
} from "../utils/reporting.js";
import { computeNextRunAt } from "../utils/reportScheduler.js";

const router = express.Router();

const safeHistoryInsert = async (payload) => {
  try {
    await insertReportHistory(payload);
  } catch (err) {
    console.error("⚠️ Report history write warning:", err.message);
  }
};

const buildLastDays = (days = 7) => {
  const result = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    result.push({ key, label });
  }

  return result;
};

router.get("/summary", adminAuth, (req, res) => {
  const summary = {
    pendingRequests: 0,
    approvals7d: 0,
    resourceOpens7d: 0,
    topSubject: "N/A",
    topResourceType: "N/A",
  };

  db.query(
    "SELECT COUNT(*) AS count FROM resource_requests WHERE status='pending'",
    (pendingErr, pendingRows) => {
      if (pendingErr) return res.status(500).json({ message: "DB error" });
      summary.pendingRequests = pendingRows[0]?.count || 0;

      db.query(
        "SELECT COUNT(*) AS count FROM resource_requests WHERE status='approved' AND updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
        (approveErr, approveRows) => {
          if (approveErr) return res.status(500).json({ message: "DB error" });
          summary.approvals7d = approveRows[0]?.count || 0;

          db.query(
            "SELECT COUNT(*) AS count FROM analytics_events WHERE event_type='resource_open' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
            (eventErr, eventRows) => {
              if (eventErr) return res.status(500).json({ message: "DB error" });
              summary.resourceOpens7d = eventRows[0]?.count || 0;

              db.query(
                "SELECT subject, COUNT(*) AS count FROM courses WHERE subject IS NOT NULL AND subject != '' GROUP BY subject ORDER BY count DESC LIMIT 1",
                (subjectErr, subjectRows) => {
                  if (subjectErr) return res.status(500).json({ message: "DB error" });
                  summary.topSubject = subjectRows[0]?.subject || "N/A";

                  db.query(
                    "SELECT resource_type, COUNT(*) AS count FROM course_lessons GROUP BY resource_type ORDER BY count DESC LIMIT 1",
                    (typeErr, typeRows) => {
                      if (typeErr) return res.status(500).json({ message: "DB error" });
                      summary.topResourceType = typeRows[0]?.resource_type || "N/A";

                      res.json(summary);
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

router.get("/trends", adminAuth, (req, res) => {
  const days = buildLastDays(7);
  const response = {
    labels: days.map((d) => d.label),
    approvalsByDay: days.map(() => 0),
    resourceOpensByDay: days.map(() => 0),
    topSubjects: [],
  };

  db.query(
    `SELECT DATE(updated_at) AS day, COUNT(*) AS count
     FROM resource_requests
     WHERE status='approved' AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(updated_at)
     ORDER BY day ASC`,
    (approvalsErr, approvalsRows) => {
      if (approvalsErr) return res.status(500).json({ message: "DB error" });

      const approvalMap = new Map(
        (approvalsRows || []).map((row) => [
          new Date(row.day).toISOString().slice(0, 10),
          Number(row.count) || 0,
        ])
      );

      response.approvalsByDay = days.map((d) => approvalMap.get(d.key) || 0);

      db.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
         FROM analytics_events
         WHERE event_type='resource_open' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
         GROUP BY DATE(created_at)
         ORDER BY day ASC`,
        (eventsErr, eventsRows) => {
          if (eventsErr) return res.status(500).json({ message: "DB error" });

          const eventMap = new Map(
            (eventsRows || []).map((row) => [
              new Date(row.day).toISOString().slice(0, 10),
              Number(row.count) || 0,
            ])
          );

          response.resourceOpensByDay = days.map((d) => eventMap.get(d.key) || 0);

          db.query(
            `SELECT subject, COUNT(*) AS count
             FROM courses
             WHERE subject IS NOT NULL AND subject != ''
             GROUP BY subject
             ORDER BY count DESC
             LIMIT 5`,
            (subjectErr, subjectRows) => {
              if (subjectErr) return res.status(500).json({ message: "DB error" });

              response.topSubjects = (subjectRows || []).map((row) => ({
                subject: row.subject,
                count: Number(row.count) || 0,
              }));

              res.json(response);
            }
          );
        }
      );
    }
  );
});

router.get("/report", adminAuth, async (req, res) => {
  const parsedDays = Number(req.query.days);
  const days = Number.isFinite(parsedDays) ? Math.min(365, Math.max(1, Math.floor(parsedDays))) : 30;
  const format = String(req.query.format || "csv").toLowerCase();
  const adminId = req.admin?.adminId || null;

  try {
    const payload = await buildReportPayload({ days });
    const generatedAt = payload.summary.generatedAt;

    if (format === "json") {
      await safeHistoryInsert({
        adminId,
        reportType: "analytics",
        format,
        rangeDays: days,
        status: "success",
      });
      return res.json(payload);
    }

    const filename = `admin-report-${generatedAt.slice(0, 10)}-${days}d.csv`;
    const csvContent = buildReportCsv(payload);

    await safeHistoryInsert({
      adminId,
      reportType: "analytics",
      format,
      rangeDays: days,
      status: "success",
      fileName: filename,
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=\"${filename}\"`);
    return res.send(csvContent);
  } catch (err) {
    await safeHistoryInsert({
      adminId,
      reportType: "analytics",
      format,
      rangeDays: days,
      status: "failed",
      errorMessage: err.message || "Failed to generate report",
    });
    return res.status(500).json({ message: "Failed to generate report" });
  }
});

router.get("/report/history", adminAuth, async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  try {
    const rows = await queryAsync(
      `SELECT
        h.id,
        h.report_type,
        h.format,
        h.range_days,
        h.status,
        h.recipient_email,
        h.file_name,
        h.error_message,
        h.created_at,
        COALESCE(a.name, a.email, 'Admin') AS admin_name
      FROM report_generation_history h
      LEFT JOIN admin a ON a.id = h.admin_id
      ORDER BY h.created_at DESC
      LIMIT ?`,
      [limit]
    );

    return res.json(rows || []);
  } catch {
    return res.status(500).json({ message: "Failed to load report history" });
  }
});

router.get("/report/schedules", adminAuth, async (req, res) => {
  const adminId = req.admin?.adminId;

  try {
    const rows = await queryAsync(
      `SELECT id, frequency, time_of_day, range_days, recipient_email, is_active, next_run_at, last_run_at, last_error
       FROM report_schedules
       WHERE admin_id = ?
       ORDER BY created_at DESC`,
      [adminId]
    );

    return res.json(rows || []);
  } catch {
    return res.status(500).json({ message: "Failed to load report schedules" });
  }
});

router.post("/report/schedules", adminAuth, async (req, res) => {
  const adminId = req.admin?.adminId;
  const frequency = req.body?.frequency === "weekly" ? "weekly" : "daily";
  const timeOfDay = String(req.body?.timeOfDay || "09:00").slice(0, 5);
  const rangeDays = Math.min(365, Math.max(1, Number(req.body?.rangeDays) || 30));
  const recipientEmail = String(req.body?.recipientEmail || "").trim() || null;
  const isActive = req.body?.isActive === false ? 0 : 1;

  if (!/^\d{2}:\d{2}$/.test(timeOfDay)) {
    return res.status(400).json({ message: "Invalid time format. Use HH:MM" });
  }

  try {
    const existing = await queryAsync(
      "SELECT id FROM report_schedules WHERE admin_id = ? LIMIT 1",
      [adminId]
    );

    const nextRunAt = computeNextRunAt(frequency, timeOfDay);

    if (existing.length > 0) {
      await queryAsync(
        `UPDATE report_schedules
         SET frequency = ?, time_of_day = ?, range_days = ?, recipient_email = ?, is_active = ?, next_run_at = ?, last_error = NULL
         WHERE id = ?`,
        [frequency, timeOfDay, rangeDays, recipientEmail, isActive, nextRunAt, existing[0].id]
      );

      return res.json({ message: "Schedule updated", id: existing[0].id });
    }

    const inserted = await queryAsync(
      `INSERT INTO report_schedules
        (admin_id, frequency, time_of_day, range_days, recipient_email, is_active, next_run_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [adminId, frequency, timeOfDay, rangeDays, recipientEmail, isActive, nextRunAt]
    );

    return res.status(201).json({ message: "Schedule created", id: inserted.insertId });
  } catch {
    return res.status(500).json({ message: "Failed to save schedule" });
  }
});

router.delete("/report/schedules/:id", adminAuth, async (req, res) => {
  const adminId = req.admin?.adminId;
  const scheduleId = Number(req.params.id);

  if (!Number.isFinite(scheduleId)) {
    return res.status(400).json({ message: "Invalid schedule id" });
  }

  try {
    await queryAsync(
      "DELETE FROM report_schedules WHERE id = ? AND admin_id = ?",
      [scheduleId, adminId]
    );
    return res.json({ message: "Schedule deleted" });
  } catch {
    return res.status(500).json({ message: "Failed to delete schedule" });
  }
});

export default router;
