import apiClient from "./apiClient.js";

// apiClient's request interceptor already attaches the Bearer token
// (preferring adminToken when present), so these calls don't need to
// build auth headers manually.
export const listUsers = async ({ role, status, search } = {}) => {
  const { data } = await apiClient.get("/api/admin/users", {
    params: { role: role || undefined, status: status || undefined, search: search || undefined },
  });
  return data;
};

export const changeUserRole = async (id, role) => {
  const { data } = await apiClient.patch(`/api/admin/users/${id}/role`, { role });
  return data;
};

export const changeUserStatus = async (id, isActive) => {
  const { data } = await apiClient.patch(`/api/admin/users/${id}/status`, { isActive });
  return data;
};
