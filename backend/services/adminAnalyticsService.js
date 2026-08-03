import { AppError } from "../utils/AppError.js";
import * as adminAnalyticsRepository from "../repositories/adminAnalyticsRepository.js";
import { buildReportPayload, buildReportCsv, insertReportHistory } from "../utils/reporting.js";
import { computeNextRunAt } from "../utils/reportScheduler.js";
import logger from "../utils/logger.js";

const buildLastDays = (days = 7) => {
  const result = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    result.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString("en-US", { weekday: "short" }) });
  }

  return result;
};

const safeHistoryInsert = async (payload) => {
  try {
    await insertReportHistory(payload);
  } catch (err) {
    logger.warn({ err }, "Report history write warning");
  }
};

export const getSummary = async () => {
  const [pendingRequests, approvals7d, resourceOpens7d, topSubject, topResourceType] = await Promise.all([
    adminAnalyticsRepository.countPendingRequests(),
    adminAnalyticsRepository.countApprovalsLast7Days(),
    adminAnalyticsRepository.countResourceOpensLast7Days(),
    adminAnalyticsRepository.findTopSubject(),
    adminAnalyticsRepository.findTopResourceType(),
  ]);

  return { pendingRequests, approvals7d, resourceOpens7d, topSubject, topResourceType };
};

export const getTrends = async () => {
  const days = buildLastDays(7);
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 6);
  sinceDate.setHours(0, 0, 0, 0);

  const [approvalsRows, eventsRows, topSubjects] = await Promise.all([
    adminAnalyticsRepository.findApprovalsByDay(sinceDate),
    adminAnalyticsRepository.findResourceOpensByDay(sinceDate),
    adminAnalyticsRepository.findTopSubjects(5),
  ]);

  const approvalMap = new Map(
    approvalsRows.map((row) => [new Date(row.day).toISOString().slice(0, 10), Number(row.count) || 0])
  );
  const eventMap = new Map(
    eventsRows.map((row) => [new Date(row.day).toISOString().slice(0, 10), Number(row.count) || 0])
  );

  return {
    labels: days.map((d) => d.label),
    approvalsByDay: days.map((d) => approvalMap.get(d.key) || 0),
    resourceOpensByDay: days.map((d) => eventMap.get(d.key) || 0),
    topSubjects: topSubjects.map((row) => ({ subject: row.subject, count: Number(row.count) || 0 })),
  };
};

export const generateReport = async ({ days, format, adminId }) => {
  try {
    const payload = await buildReportPayload({ days });
    const generatedAt = payload.summary.generatedAt;

    if (format === "json") {
      await safeHistoryInsert({ adminId, reportType: "analytics", format, rangeDays: days, status: "success" });
      return { kind: "json", payload };
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

    return { kind: "csv", filename, csvContent };
  } catch (err) {
    await safeHistoryInsert({
      adminId,
      reportType: "analytics",
      format,
      rangeDays: days,
      status: "failed",
      errorMessage: err.message || "Failed to generate report",
    });
    throw new AppError("Failed to generate report", 500);
  }
};

export const getReportHistory = (limit) => adminAnalyticsRepository.findReportHistory(limit);

export const getSchedule = (adminId) => adminAnalyticsRepository.findScheduleByAdmin(adminId);

export const saveSchedule = async (adminId, body) => {
  const frequency = body?.frequency === "weekly" ? "weekly" : "daily";
  const timeOfDay = String(body?.timeOfDay || "09:00").slice(0, 5);

  if (!/^\d{2}:\d{2}$/.test(timeOfDay)) {
    throw new AppError("Invalid time format. Use HH:MM", 400);
  }

  const rangeDays = Math.min(365, Math.max(1, Number(body?.rangeDays) || 30));
  const recipientEmail = String(body?.recipientEmail || "").trim() || null;
  const isActive = body?.isActive === false ? 0 : 1;
  const nextRunAt = computeNextRunAt(frequency, timeOfDay);

  return adminAnalyticsRepository.upsertSchedule(adminId, {
    frequency,
    timeOfDay,
    rangeDays,
    recipientEmail,
    isActive,
    nextRunAt,
  });
};

export const deleteSchedule = async (adminId, scheduleId) => {
  if (!Number.isFinite(scheduleId)) {
    throw new AppError("Invalid schedule id", 400);
  }
  await adminAnalyticsRepository.deleteSchedule(scheduleId, adminId);
};
