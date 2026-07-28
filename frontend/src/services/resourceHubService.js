import apiClient from "./apiClient.js";

// See courseService.js's listCourses for why pageSize is maxed out here
// rather than surfacing pagination controls - same backend contract, same
// "the current UI browses everything at once" behavior to preserve.
export const listResources = async ({ search, subject, department } = {}) => {
  const { data } = await apiClient.get("/api/resource-hub", {
    params: {
      search: search || undefined,
      subject: subject || undefined,
      department: department || undefined,
      pageSize: 100,
    },
  });
  return data.items;
};

export const getResource = async (id) => {
  const { data } = await apiClient.get(`/api/resource-hub/${id}`);
  return data;
};

export const recordDownload = async (id) => {
  const { data } = await apiClient.post(`/api/resource-hub/${id}/download`);
  return data;
};

export const listComments = async (id) => {
  const { data } = await apiClient.get(`/api/resource-hub/${id}/comments`);
  return data;
};

export const addComment = async (id, { commentText, parentCommentId }) => {
  const { data } = await apiClient.post(`/api/resource-hub/${id}/comments`, {
    commentText,
    parentCommentId,
  });
  return data;
};

export const deleteComment = async (commentId) => {
  const { data } = await apiClient.delete(`/api/resource-hub/comments/${commentId}`);
  return data;
};

export const getRatingSummary = async (id) => {
  const { data } = await apiClient.get(`/api/resource-hub/${id}/rating`);
  return data;
};

export const rateResource = async (id, rating) => {
  const { data } = await apiClient.post(`/api/resource-hub/${id}/rating`, { rating });
  return data;
};

export const toggleBookmark = async (id) => {
  const { data } = await apiClient.post(`/api/resource-hub/${id}/bookmark`);
  return data;
};

export const listMyBookmarks = async () => {
  const { data } = await apiClient.get("/api/resource-hub/bookmarks/mine");
  return data;
};
