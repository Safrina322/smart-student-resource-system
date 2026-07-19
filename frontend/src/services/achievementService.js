import apiClient from "./apiClient.js";

export const getAchievements = async () => {
  const { data } = await apiClient.get("/api/achievements");
  return data;
};

export const getActivityHistory = async () => {
  const { data } = await apiClient.get("/api/achievements/history");
  return data;
};
