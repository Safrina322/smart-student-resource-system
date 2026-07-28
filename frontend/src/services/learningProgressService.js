import apiClient from "./apiClient.js";

export const trackAccess = async (courseId) => {
  const { data } = await apiClient.post("/api/user/track-access", { courseId });
  return data;
};

export const getContinueLearning = async () => {
  const { data } = await apiClient.get("/api/user/continue-learning");
  return data;
};
