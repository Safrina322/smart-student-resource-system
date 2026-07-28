import apiClient from "./apiClient.js";

export const listAuditLogs = async () => {
  const { data } = await apiClient.get("/api/admin/audit/logs");
  return data.logs || [];
};
