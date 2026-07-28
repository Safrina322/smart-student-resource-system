import apiClient from "./apiClient.js";

// Multipart bodies (FormData) are passed straight through - axios detects
// FormData and sets the correct Content-Type/boundary itself.

export const addCourse = async (formData) => {
  const { data } = await apiClient.post("/api/admin/courses/add", formData);
  return data;
};

export const getCourseLessons = async (courseId) => {
  const { data } = await apiClient.get(`/api/admin/courses/${courseId}/lessons`);
  return data;
};

export const addLesson = async (courseId, formData) => {
  const { data } = await apiClient.post(`/api/admin/courses/${courseId}/lessons`, formData);
  return data;
};

export const updateLesson = async (lessonId, payload) => {
  const { data } = await apiClient.put(`/api/admin/courses/lessons/${lessonId}`, payload);
  return data;
};

export const deleteLesson = async (lessonId) => {
  const { data } = await apiClient.delete(`/api/admin/courses/lessons/${lessonId}`);
  return data;
};
