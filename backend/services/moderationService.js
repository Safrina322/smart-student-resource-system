import { AppError } from "../utils/AppError.js";
import * as lecturerResourceRepository from "../repositories/lecturerResourceRepository.js";

export const listQueue = (status = "pending") => lecturerResourceRepository.findByStatus(status);

const review = async (id, reviewerId, status, comment) => {
  const resource = await lecturerResourceRepository.findById(id);
  if (!resource) {
    throw new AppError("Resource not found", 404);
  }

  await lecturerResourceRepository.setReviewStatus(id, { status, reviewerId, comment });
  return lecturerResourceRepository.findById(id);
};

export const approve = (id, reviewerId, comment) => review(id, reviewerId, "approved", comment);
export const reject = (id, reviewerId, comment) => review(id, reviewerId, "rejected", comment);
export const flag = (id, reviewerId, comment) => review(id, reviewerId, "flagged", comment);
