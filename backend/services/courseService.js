import { AppError } from "../utils/AppError.js";
import * as courseRepository from "../repositories/courseRepository.js";
import { buildPaginationMeta } from "../utils/pagination.js";

export const listAll = async ({ page, pageSize }) => {
  const { rows, total } = await courseRepository.findAll({ page, pageSize });
  return { items: rows, pagination: buildPaginationMeta(page, pageSize, total) };
};

export const getById = async (id) => {
  const course = await courseRepository.findById(id);
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  return course;
};

export const getLessons = (id) => courseRepository.findLessonsByCourseId(id);
