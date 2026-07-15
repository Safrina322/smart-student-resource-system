import apiClient from "./apiClient.js";

export const registerUser = async ({ username, email, password }) => {
  const { data } = await apiClient.post("/api/auth/register", { username, email, password });
  return data;
};

export const loginUser = async ({ username, password }) => {
  const { data } = await apiClient.post("/api/auth/login", { username, password });
  return data;
};

export const loginAdmin = async ({ email, password }) => {
  const { data } = await apiClient.post("/api/admin/login", { email, password });
  return data;
};
