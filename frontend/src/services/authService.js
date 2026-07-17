import apiClient from "./apiClient.js";

export const registerUser = async ({ username, email, password }) => {
  const { data } = await apiClient.post("/api/auth/register", { username, email, password });
  return data;
};

export const loginUser = async ({ username, password, rememberMe }) => {
  const { data } = await apiClient.post("/api/auth/login", { username, password, rememberMe });
  return data;
};

export const loginAdmin = async ({ email, password }) => {
  const { data } = await apiClient.post("/api/admin/login", { email, password });
  return data;
};

export const verifyEmail = async (token) => {
  const { data } = await apiClient.get(`/api/auth/verify-email/${token}`);
  return data;
};

export const resendVerificationEmail = async (email) => {
  const { data } = await apiClient.post("/api/auth/resend-verification", { email });
  return data;
};

export const requestPasswordReset = async (email) => {
  const { data } = await apiClient.post("/api/auth/forgot-password", { email });
  return data;
};

export const resetPassword = async ({ token, newPassword }) => {
  const { data } = await apiClient.post("/api/auth/reset-password", { token, newPassword });
  return data;
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await apiClient.post("/api/auth/change-password", { currentPassword, newPassword });
  return data;
};

export const getMyProfile = async () => {
  const { data } = await apiClient.get("/api/auth/me");
  return data;
};

export const updateMyProfile = async (profile) => {
  const { data } = await apiClient.put("/api/auth/profile", profile);
  return data;
};
