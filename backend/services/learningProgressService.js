import { AppError } from "../utils/AppError.js";
import * as learningProgressRepository from "../repositories/learningProgressRepository.js";

export const trackAccess = async (userId, { courseId, lessonId }) => {
  if (!courseId) {
    throw new AppError("courseId is required", 400);
  }
  await learningProgressRepository.trackAccess(userId, courseId, lessonId || null);
};

export const getContinueLearning = async (userId) => {
  const [continueLearning, recentActivity] = await Promise.all([
    learningProgressRepository.findLastAccessed(userId),
    learningProgressRepository.findRecentActivity(userId),
  ]);

  return {
    success: true,
    continueLearning,
    recentActivity,
  };
};
