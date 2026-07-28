import { AppError } from "../utils/AppError.js";
import * as publicResourceRepository from "../repositories/publicResourceRepository.js";
import { buildPaginationMeta } from "../utils/pagination.js";

export const listApproved = async ({ search, subject, department, page, pageSize }) => {
  const { rows, total } = await publicResourceRepository.findApproved({
    search,
    subject,
    department,
    page,
    pageSize,
  });
  return { items: rows, pagination: buildPaginationMeta(page, pageSize, total) };
};

export const getDetail = async (id) => {
  const resource = await publicResourceRepository.findApprovedById(id);
  if (!resource) {
    throw new AppError("Resource not found", 404);
  }

  // Best-effort view counter; a resource that already loaded doesn't need
  // the increment to block the response.
  publicResourceRepository.incrementViews(id).catch(() => {});

  return resource;
};

export const recordDownload = async (id) => {
  const resource = await publicResourceRepository.findApprovedById(id);
  if (!resource) {
    throw new AppError("Resource not found", 404);
  }

  await publicResourceRepository.incrementDownloads(id);
  return { resourceLink: resource.resource_link };
};
