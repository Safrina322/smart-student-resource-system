import apiClient from "./apiClient.js";

export const getSummary = async () => {
  const { data } = await apiClient.get("/api/admin/analytics/summary");
  return data;
};

export const getTrends = async () => {
  const { data } = await apiClient.get("/api/admin/analytics/trends");
  return data;
};

export const getReportHistory = async (limit = 12) => {
  const { data } = await apiClient.get("/api/admin/analytics/report/history", { params: { limit } });
  return Array.isArray(data) ? data : [];
};

export const getSchedule = async () => {
  const { data } = await apiClient.get("/api/admin/analytics/report/schedules");
  return Array.isArray(data) ? data : [];
};

export const saveSchedule = async (payload) => {
  const { data } = await apiClient.post("/api/admin/analytics/report/schedules", payload);
  return data;
};

export const deleteSchedule = async (id) => {
  const { data } = await apiClient.delete(`/api/admin/analytics/report/schedules/${id}`);
  return data;
};

// Blob response (CSV download), not JSON - kept separate from the
// interceptor's usual error-message normalization since a failed blob
// request doesn't carry a readable {message} body.
export const downloadReport = (days) =>
  apiClient.get("/api/admin/analytics/report", {
    params: { days, format: "csv" },
    responseType: "blob",
  });
