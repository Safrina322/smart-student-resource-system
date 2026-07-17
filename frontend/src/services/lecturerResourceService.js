import apiClient from "./apiClient.js";

export const listMyResources = async () => {
  const { data } = await apiClient.get("/api/lecturer/resources");
  return data;
};

export const uploadResource = async (payload) => {
  const { data } = await apiClient.post("/api/lecturer/resources", payload);
  return data;
};

export const updateResource = async (id, payload) => {
  const { data } = await apiClient.put(`/api/lecturer/resources/${id}`, payload);
  return data;
};

export const deleteResource = async (id) => {
  const { data } = await apiClient.delete(`/api/lecturer/resources/${id}`);
  return data;
};

export const getLecturerAnalytics = async () => {
  const { data } = await apiClient.get("/api/lecturer/resources/analytics");
  return data;
};
