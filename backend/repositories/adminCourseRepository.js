import { queryAsync } from "../db.js";

export const createCourse = async ({ title, description, subject, level, duration, image }) => {
  const result = await queryAsync(
    "INSERT INTO courses (title, description, subject, level, duration, image) VALUES (?, ?, ?, ?, ?, ?)",
    [title, description, subject, level, duration, image]
  );
  return result.insertId;
};

export const createLesson = async ({
  courseId,
  lessonTitle,
  lessonDescription,
  resourceType,
  resourceUrl,
  lessonOrder,
}) => {
  const result = await queryAsync(
    `INSERT INTO course_lessons
     (course_id, lesson_title, lesson_description, resource_type, resource_url, lesson_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [courseId, lessonTitle, lessonDescription || "", resourceType, resourceUrl, Number(lessonOrder) || 1]
  );
  return result.insertId;
};

export const findLessonsByCourse = (courseId) =>
  queryAsync(
    "SELECT * FROM course_lessons WHERE course_id = ? ORDER BY lesson_order ASC, created_at ASC",
    [courseId]
  );

export const updateLesson = (lessonId, { lessonTitle, lessonDescription, resourceType, resourceUrl, lessonOrder }) =>
  queryAsync(
    `UPDATE course_lessons
     SET lesson_title = ?, lesson_description = ?, resource_type = ?, resource_url = ?, lesson_order = ?
     WHERE id = ?`,
    [lessonTitle, lessonDescription || "", resourceType, resourceUrl, Number(lessonOrder) || 1, lessonId]
  );

export const deleteLesson = (lessonId) =>
  queryAsync("DELETE FROM course_lessons WHERE id = ?", [lessonId]);
