import { AppError } from "../utils/AppError.js";
import * as adminCourseRepository from "../repositories/adminCourseRepository.js";
import { logAdminAction } from "../utils/auditLogger.js";

export const addCourseWithLesson = async ({ body, imageFile, resourceFile, adminId }) => {
  const {
    title,
    description,
    subject,
    level,
    duration,
    lesson_title: lessonTitle,
    lesson_description: lessonDescription,
    resource_type: resourceType,
    resource_url: resourceUrl,
    lesson_order: lessonOrder,
  } = body;

  if (!imageFile) {
    throw new AppError("Image required", 400);
  }

  const image = imageFile.secure_url;
  const resolvedResourceUrl = resourceFile ? resourceFile.secure_url : resourceUrl || "";

  if (!lessonTitle || !resourceType || !resolvedResourceUrl) {
    throw new AppError("Lesson title, type and URL/file are required", 400);
  }

  const courseId = await adminCourseRepository.createCourse({
    title,
    description,
    subject,
    level,
    duration,
    image,
  });

  try {
    const lessonId = await adminCourseRepository.createLesson({
      courseId,
      lessonTitle,
      lessonDescription,
      resourceType,
      resourceUrl: resolvedResourceUrl,
      lessonOrder,
    });

    logAdminAction({
      adminId,
      actionType: "course_created",
      targetType: "course",
      targetId: courseId,
      details: `Created course "${title}" with first lesson "${lessonTitle}"`,
    });

    return { courseId, lessonId };
  } catch (err) {
    throw new AppError("Course created, but lesson save failed", 500);
  }
};

export const addLessonToCourse = async ({ courseId, body, resourceFile, adminId }) => {
  const {
    lesson_title: lessonTitle,
    lesson_description: lessonDescription,
    resource_type: resourceType,
    resource_url: resourceUrl,
    lesson_order: lessonOrder,
  } = body;

  const finalUrl = resourceFile ? resourceFile.secure_url : resourceUrl || "";

  if (!lessonTitle || !resourceType || !finalUrl) {
    throw new AppError("Lesson title, type and URL/file are required", 400);
  }

  const lessonId = await adminCourseRepository.createLesson({
    courseId,
    lessonTitle,
    lessonDescription,
    resourceType,
    resourceUrl: finalUrl,
    lessonOrder,
  });

  logAdminAction({
    adminId,
    actionType: "lesson_created",
    targetType: "course_lesson",
    targetId: lessonId,
    details: `Added lesson "${lessonTitle}" to course ${courseId}`,
  });

  return lessonId;
};

export const getLessons = (courseId) => adminCourseRepository.findLessonsByCourse(courseId);

export const updateLesson = async (lessonId, body, adminId) => {
  const {
    lesson_title: lessonTitle,
    lesson_description: lessonDescription,
    resource_type: resourceType,
    resource_url: resourceUrl,
    lesson_order: lessonOrder,
  } = body;

  await adminCourseRepository.updateLesson(lessonId, {
    lessonTitle,
    lessonDescription,
    resourceType,
    resourceUrl,
    lessonOrder,
  });

  logAdminAction({
    adminId,
    actionType: "lesson_updated",
    targetType: "course_lesson",
    targetId: Number(lessonId),
    details: `Updated lesson ${lessonId} to "${lessonTitle}"`,
  });
};

export const deleteLesson = async (lessonId, adminId) => {
  await adminCourseRepository.deleteLesson(lessonId);

  logAdminAction({
    adminId,
    actionType: "lesson_deleted",
    targetType: "course_lesson",
    targetId: Number(lessonId),
    details: `Deleted lesson ${lessonId}`,
  });
};
