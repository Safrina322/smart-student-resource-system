import { queryAsync } from "../db.js";

export const create = async ({
  uploaderId,
  title,
  description,
  subject,
  department,
  semester,
  courseId,
  resourceType,
  resourceLink,
  tags,
}) => {
  const result = await queryAsync(
    `INSERT INTO lecturer_resources
      (uploader_id, title, description, subject, department, semester, course_id, resource_type, resource_link, tags)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [uploaderId, title, description || null, subject || null, department || null, semester || null, courseId || null, resourceType, resourceLink, tags || null]
  );
  return result.insertId;
};

export const findById = async (id) => {
  const rows = await queryAsync("SELECT * FROM lecturer_resources WHERE id = ?", [id]);
  return rows[0] || null;
};

export const findByUploader = (uploaderId) =>
  queryAsync(
    "SELECT * FROM lecturer_resources WHERE uploader_id = ? ORDER BY created_at DESC",
    [uploaderId]
  );

export const findByStatus = (status) =>
  queryAsync(
    `SELECT lr.*, u.username AS uploader_name
     FROM lecturer_resources lr
     JOIN users u ON u.id = lr.uploader_id
     WHERE lr.status = ?
     ORDER BY lr.created_at ASC`,
    [status]
  );

export const updateOwn = async (id, uploaderId, { title, description, subject, department, semester, courseId, resourceType, resourceLink, tags }) => {
  await queryAsync(
    `UPDATE lecturer_resources
     SET title = ?, description = ?, subject = ?, department = ?, semester = ?, course_id = ?,
         resource_type = ?, resource_link = ?, tags = ?, status = 'pending', reviewed_by = NULL, review_comment = NULL
     WHERE id = ? AND uploader_id = ?`,
    [title, description || null, subject || null, department || null, semester || null, courseId || null, resourceType, resourceLink, tags || null, id, uploaderId]
  );
};

export const deleteOwn = async (id, uploaderId) => {
  const result = await queryAsync(
    "DELETE FROM lecturer_resources WHERE id = ? AND uploader_id = ?",
    [id, uploaderId]
  );
  return result.affectedRows > 0;
};

export const setReviewStatus = async (id, { status, reviewerId, comment }) => {
  await queryAsync(
    `UPDATE lecturer_resources
     SET status = ?, reviewed_by = ?, review_comment = ?, reviewed_at = NOW()
     WHERE id = ?`,
    [status, reviewerId, comment || null, id]
  );
};

export const countByUploaderAndStatus = (uploaderId) =>
  queryAsync(
    `SELECT status, COUNT(*) AS count
     FROM lecturer_resources
     WHERE uploader_id = ?
     GROUP BY status`,
    [uploaderId]
  );
