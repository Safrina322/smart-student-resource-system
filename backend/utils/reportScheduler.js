import db from "../db.js";
import { sendAdminReportEmail } from "./mailer.js";
import {
  queryAsync,
  buildReportPayload,
  buildReportCsv,
  insertReportHistory,
} from "./reporting.js";
import logger from "./logger.js";

const POLL_INTERVAL_MS = 60 * 1000;

const nextRunFrom = (baseDate, frequency, timeOfDay) => {
  const now = new Date(baseDate);
  const [hh, mm] = String(timeOfDay || "09:00").split(":").map((v) => Number(v) || 0);
  const next = new Date(now);
  next.setSeconds(0, 0);
  next.setHours(hh, mm, 0, 0);

  if (next <= now) {
    const jumpDays = frequency === "weekly" ? 7 : 1;
    next.setDate(next.getDate() + jumpDays);
  }

  return next;
};

const processDueSchedules = async () => {
  const dueSchedules = await queryAsync(
    `SELECT rs.*, a.email AS admin_email
     FROM report_schedules rs
     LEFT JOIN admin a ON a.id = rs.admin_id
     WHERE rs.is_active = 1
       AND rs.next_run_at IS NOT NULL
       AND rs.next_run_at <= NOW()`
  );

  for (const schedule of dueSchedules) {
    const recipientEmail = schedule.recipient_email || schedule.admin_email;
    const rangeDays = Number(schedule.range_days) || 30;
    const frequency = schedule.frequency || "daily";

    if (!recipientEmail) {
      await insertReportHistory({
        adminId: schedule.admin_id,
        scheduleId: schedule.id,
        reportType: "analytics",
        format: "csv",
        rangeDays,
        status: "failed",
        recipientEmail: null,
        errorMessage: "No recipient email configured",
      });

      const nextRun = nextRunFrom(new Date(), frequency, schedule.time_of_day);
      await queryAsync(
        `UPDATE report_schedules
         SET last_error = ?, next_run_at = ?
         WHERE id = ?`,
        ["No recipient email configured", nextRun, schedule.id]
      );
      continue;
    }

    try {
      const payload = await buildReportPayload({ days: rangeDays });
      const csvContent = buildReportCsv(payload);
      const generatedDate = new Date().toISOString().slice(0, 10);
      const fileName = `admin-report-${generatedDate}-${rangeDays}d.csv`;

      await sendAdminReportEmail({
        to: recipientEmail,
        frequency,
        rangeDays,
        csvContent,
        fileName,
      });

      await insertReportHistory({
        adminId: schedule.admin_id,
        scheduleId: schedule.id,
        reportType: "analytics",
        format: "csv",
        rangeDays,
        status: "success",
        recipientEmail,
        fileName,
      });

      const nextRun = nextRunFrom(new Date(), frequency, schedule.time_of_day);
      await queryAsync(
        `UPDATE report_schedules
         SET last_run_at = NOW(), last_error = NULL, next_run_at = ?
         WHERE id = ?`,
        [nextRun, schedule.id]
      );
    } catch (err) {
      await insertReportHistory({
        adminId: schedule.admin_id,
        scheduleId: schedule.id,
        reportType: "analytics",
        format: "csv",
        rangeDays,
        status: "failed",
        recipientEmail,
        errorMessage: err.message || "Scheduled report failed",
      });

      const nextRun = nextRunFrom(new Date(), frequency, schedule.time_of_day);
      await queryAsync(
        `UPDATE report_schedules
         SET last_error = ?, next_run_at = ?
         WHERE id = ?`,
        [err.message || "Scheduled report failed", nextRun, schedule.id]
      );
    }
  }
};

export const startReportScheduler = () => {
  setInterval(() => {
    processDueSchedules().catch((err) => {
      logger.warn({ err }, "Report scheduler warning");
    });
  }, POLL_INTERVAL_MS);
};

export const computeNextRunAt = (frequency, timeOfDay) => nextRunFrom(new Date(), frequency, timeOfDay);
