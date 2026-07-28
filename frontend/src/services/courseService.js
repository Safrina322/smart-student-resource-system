import apiClient from "./apiClient.js";

// The backend paginates this endpoint (default 20/page, 100 max). Every
// current caller wants "just show me everything" rather than paged browsing,
// so this requests the max page size and unwraps the envelope - one place
// absorbing that instead of every page needing to know the response is
// paginated. Revisit if the course catalog ever needs to exceed 100 rows.
export const listCourses = async () => {
  const { data } = await apiClient.get("/api/courses", { params: { pageSize: 100 } });
  return data.items;
};

export const getCourse = async (id) => {
  const { data } = await apiClient.get(`/api/courses/${id}`);
  return data;
};

export const getCourseLessons = async (id) => {
  const { data } = await apiClient.get(`/api/courses/${id}/lessons`);
  return Array.isArray(data) ? data : [];
};
