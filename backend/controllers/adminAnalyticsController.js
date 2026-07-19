import * as adminAnalyticsService from "../services/adminAnalyticsService.js";

export const summary = async (req, res) => {
  res.json(await adminAnalyticsService.getSummary());
};

export const trends = async (req, res) => {
  res.json(await adminAnalyticsService.getTrends());
};

export const report = async (req, res) => {
  const parsedDays = Number(req.query.days);
  const days = Number.isFinite(parsedDays) ? Math.min(365, Math.max(1, Math.floor(parsedDays))) : 30;
  const format = String(req.query.format || "csv").toLowerCase();
  const adminId = req.admin?.adminId || null;

  const result = await adminAnalyticsService.generateReport({ days, format, adminId });

  if (result.kind === "json") {
    return res.json(result.payload);
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
  res.send(result.csvContent);
};

export const reportHistory = async (req, res) => {
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  res.json(await adminAnalyticsService.getReportHistory(limit));
};

export const getSchedule = async (req, res) => {
  res.json(await adminAnalyticsService.getSchedule(req.admin?.adminId));
};

export const saveSchedule = async (req, res) => {
  const { id, created } = await adminAnalyticsService.saveSchedule(req.admin?.adminId, req.body);
  res.status(created ? 201 : 200).json({ message: created ? "Schedule created" : "Schedule updated", id });
};

export const deleteSchedule = async (req, res) => {
  await adminAnalyticsService.deleteSchedule(req.admin?.adminId, Number(req.params.id));
  res.json({ message: "Schedule deleted" });
};
