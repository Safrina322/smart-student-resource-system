import apiClient from "./apiClient.js";

export const getPopularCourses = async () => {
  const { data } = await apiClient.get("/api/popular/popular-courses");
  return data.popularCourses || [];
};

export const getTrending = async () => {
  const { data } = await apiClient.get("/api/popular/trending");
  return data.trendingCourses || [];
};
