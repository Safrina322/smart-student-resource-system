import apiClient from "./apiClient.js";

export const listMyRequests = async () => {
  const { data } = await apiClient.get("/api/requests/mine");
  return Array.isArray(data.requests) ? data.requests : [];
};

// Multipart body (FormData, for the optional cover image) - axios detects
// FormData and sets the correct Content-Type/boundary itself.
export const submitRequest = async (formData) => {
  const { data } = await apiClient.post("/api/requests", formData);
  return data;
};
