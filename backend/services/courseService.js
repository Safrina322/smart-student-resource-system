import { AppError } from "../utils/AppError.js";
import * as courseRepository from "../repositories/courseRepository.js";

export const listAll = () => courseRepository.findAll();

export const getById = async (id) => {
  const course = await courseRepository.findById(id);
  if (!course) {
    throw new AppError("Course not found", 404);
  }
  return course;
};

export const getLessons = (id) => courseRepository.findLessonsByCourseId(id);
