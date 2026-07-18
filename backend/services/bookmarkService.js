import { AppError } from "../utils/AppError.js";
import * as bookmarkRepository from "../repositories/bookmarkRepository.js";
import * as publicResourceRepository from "../repositories/publicResourceRepository.js";

export const toggle = async (resourceId, userId) => {
  const resource = await publicResourceRepository.findApprovedById(resourceId);
  if (!resource) {
    throw new AppError("Resource not found", 404);
  }

  const alreadyBookmarked = await bookmarkRepository.isBookmarked(resourceId, userId);
  if (alreadyBookmarked) {
    await bookmarkRepository.remove(resourceId, userId);
    return { bookmarked: false };
  }

  await bookmarkRepository.add(resourceId, userId);
  return { bookmarked: true };
};

export const listMine = (userId) => bookmarkRepository.findByUser(userId);
