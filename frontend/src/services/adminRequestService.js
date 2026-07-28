import apiClient from "./apiClient.js";

export const listRequests = async (page = 1) => {
  const { data } = await apiClient.get("/api/admin/requests", { params: { page } });
  return data;
};

export const approveRequest = async (id) => {
  const { data } = await apiClient.put(`/api/admin/requests/${id}/approve`);
  return data;
};

export const rejectRequest = async (id) => {
  const { data } = await apiClient.put(`/api/admin/requests/${id}/reject`);
  return data;
};
