import { AppError } from "../utils/AppError.js";
import * as analyticsEventRepository from "../repositories/analyticsEventRepository.js";

export const trackEvent = async (userId, { eventType, courseId, lessonId, resourceType, metadata }) => {
  if (!eventType) {
    throw new AppError("eventType is required", 400);
  }

  await analyticsEventRepository.create({
    userId,
    eventType,
    courseId,
    lessonId,
    resourceType,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
};
