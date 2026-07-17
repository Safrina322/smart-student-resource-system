import { AppError } from "../utils/AppError.js";
import * as lecturerResourceRepository from "../repositories/lecturerResourceRepository.js";

export const upload = async (uploaderId, payload) => {
  const id = await lecturerResourceRepository.create({ uploaderId, ...payload });
  return lecturerResourceRepository.findById(id);
};

export const listMine = (uploaderId) => lecturerResourceRepository.findByUploader(uploaderId);

const assertOwnership = async (id, uploaderId) => {
  const resource = await lecturerResourceRepository.findById(id);
  if (!resource) {
    throw new AppError("Resource not found", 404);
  }
  if (resource.uploader_id !== uploaderId) {
    throw new AppError("You can only manage your own resources", 403);
  }
  return resource;
};

export const update = async (id, uploaderId, payload) => {
  await assertOwnership(id, uploaderId);
  await lecturerResourceRepository.updateOwn(id, uploaderId, payload);
  return lecturerResourceRepository.findById(id);
};

export const remove = async (id, uploaderId) => {
  await assertOwnership(id, uploaderId);
  await lecturerResourceRepository.deleteOwn(id, uploaderId);
};

export const analytics = async (uploaderId) => {
  const counts = await lecturerResourceRepository.countByUploaderAndStatus(uploaderId);
  const summary = { pending: 0, approved: 0, rejected: 0, flagged: 0 };
  counts.forEach((row) => {
    summary[row.status] = Number(row.count);
  });
  return summary;
};
