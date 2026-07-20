import apiClient from "./apiClient.js";

export const getResourceSummary = async (resourceId) => {
  const { data } = await apiClient.get(`/api/ai/resources/${resourceId}/summary`);
  return data;
};

export const getResourceQuiz = async (resourceId, count = 5) => {
  const { data } = await apiClient.get(`/api/ai/resources/${resourceId}/quiz`, { params: { count } });
  return data;
};

export const getResourceFlashcards = async (resourceId, count = 8) => {
  const { data } = await apiClient.get(`/api/ai/resources/${resourceId}/flashcards`, { params: { count } });
  return data;
};

export const chatWithResource = async (resourceId, message, history = []) => {
  const { data } = await apiClient.post(`/api/ai/resources/${resourceId}/chat`, { message, history });
  return data;
};

export const generateStudyPlan = async ({ goal, hoursPerWeek, targetWeeks }) => {
  const { data } = await apiClient.post("/api/ai/study-plan", { goal, hoursPerWeek, targetWeeks });
  return data;
};

export const getRecommendations = async () => {
  const { data } = await apiClient.get("/api/ai/recommendations");
  return data;
};

export const searchAssist = async (query) => {
  const { data } = await apiClient.post("/api/ai/search-assist", { query });
  return data;
};
