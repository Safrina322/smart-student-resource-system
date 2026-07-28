import { queryAsync } from "../db.js";

export const findAll = async ({ page, pageSize }) => {
  const offset = (page - 1) * pageSize;
  const [rows, countRows] = await Promise.all([
    queryAsync("SELECT * FROM courses ORDER BY created_at DESC LIMIT ? OFFSET ?", [pageSize, offset]),
    queryAsync("SELECT COUNT(*) AS count FROM courses"),
  ]);
  return { rows, total: countRows[0]?.count || 0 };
};

export const findById = async (id) => {
  const rows = await queryAsync("SELECT * FROM courses WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
};

export const findLessonsByCourseId = (id) =>
  queryAsync(
    "SELECT * FROM course_lessons WHERE course_id = ? ORDER BY lesson_order ASC, created_at ASC",
    [id]
  );
