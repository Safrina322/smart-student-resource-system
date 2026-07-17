import apiClient from "./apiClient.js";

export const getReviewQueue = async (status = "pending") => {
  const { data } = await apiClient.get("/api/moderation/resources", { params: { status } });
  return data;
};

export const approveResource = async (id, comment) => {
  const { data } = await apiClient.post(`/api/moderation/resources/${id}/approve`, { comment });
  return data;
};

export const rejectResource = async (id, comment) => {
  const { data } = await apiClient.post(`/api/moderation/resources/${id}/reject`, { comment });
  return data;
};

export const flagResource = async (id, comment) => {
  const { data } = await apiClient.post(`/api/moderation/resources/${id}/flag`, { comment });
  return data;
};
