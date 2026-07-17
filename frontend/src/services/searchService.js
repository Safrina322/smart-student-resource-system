import apiClient from "./apiClient.js";

export const searchAll = async (q) => {
  const { data } = await apiClient.get("/api/search", { params: { q } });
  return data;
};

export const getPopularSearches = async () => {
  const { data } = await apiClient.get("/api/search/popular");
  return data;
};
