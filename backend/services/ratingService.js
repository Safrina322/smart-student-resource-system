import { AppError } from "../utils/AppError.js";
import * as ratingRepository from "../repositories/ratingRepository.js";
import * as publicResourceRepository from "../repositories/publicResourceRepository.js";

export const rate = async (resourceId, userId, rating) => {
  const resource = await publicResourceRepository.findApprovedById(resourceId);
  if (!resource) {
    throw new AppError("Resource not found", 404);
  }

  await ratingRepository.upsert(resourceId, userId, rating);
  return ratingRepository.summaryByResource(resourceId);
};

export const getSummary = async (resourceId, userId) => {
  const summary = await ratingRepository.summaryByResource(resourceId);
  const myRating = userId ? await ratingRepository.findUserRating(resourceId, userId) : null;
  return { ...summary, myRating };
};
