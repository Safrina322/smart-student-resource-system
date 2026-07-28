import apiClient from "./apiClient.js";

export const trackEvent = async (payload) => {
  const { data } = await apiClient.post("/api/analytics/events", payload);
  return data;
};
