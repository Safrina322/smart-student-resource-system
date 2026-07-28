import apiClient from "./apiClient.js";

export const listNotifications = async () => {
  const { data } = await apiClient.get("/api/notifications");
  return data;
};

export const markRead = async (id) => {
  const { data } = await apiClient.patch(`/api/notifications/${id}/read`);
  return data;
};

export const markAllRead = async () => {
  const { data } = await apiClient.patch("/api/notifications/read-all");
  return data;
};
