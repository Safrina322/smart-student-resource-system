import { queryAsync } from "../db.js";

const LIST_COLUMNS = `
  lr.id, lr.title, lr.description, lr.subject, lr.department, lr.semester,
  lr.course_id, lr.resource_type, lr.resource_link, lr.tags,
  lr.views, lr.downloads, lr.created_at,
  u.username AS uploader_name,
  COALESCE(AVG(rr.rating), 0) AS average_rating,
  COUNT(DISTINCT rr.id) AS rating_count
`;

export const findApproved = async ({ search, subject, department, page, pageSize }) => {
  const conditions = ["lr.status = 'approved'"];
  const params = [];

  if (search) {
    conditions.push("(lr.title LIKE ? OR lr.description LIKE ? OR lr.tags LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  if (subject) {
    conditions.push("lr.subject = ?");
    params.push(subject);
  }

  if (department) {
    conditions.push("lr.department = ?");
    params.push(department);
  }

  const whereClause = conditions.join(" AND ");
  const offset = (page - 1) * pageSize;

  const [rows, countRows] = await Promise.all([
    queryAsync(
      `SELECT ${LIST_COLUMNS}
       FROM lecturer_resources lr
       JOIN users u ON u.id = lr.uploader_id
       LEFT JOIN resource_ratings rr ON rr.resource_id = lr.id
       WHERE ${whereClause}
       GROUP BY lr.id
       ORDER BY lr.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    ),
    // No JOIN needed here - every filterable column (title/description/tags/
    // subject/department) lives on lecturer_resources itself.
    queryAsync(`SELECT COUNT(*) AS count FROM lecturer_resources lr WHERE ${whereClause}`, params),
  ]);

  return { rows, total: countRows[0]?.count || 0 };
};

export const findApprovedById = async (id) => {
  const rows = await queryAsync(
    `SELECT ${LIST_COLUMNS}
     FROM lecturer_resources lr
     JOIN users u ON u.id = lr.uploader_id
     LEFT JOIN resource_ratings rr ON rr.resource_id = lr.id
     WHERE lr.id = ? AND lr.status = 'approved'
     GROUP BY lr.id`,
    [id]
  );
  return rows[0] || null;
};

export const incrementViews = (id) =>
  queryAsync("UPDATE lecturer_resources SET views = views + 1 WHERE id = ?", [id]);

export const incrementDownloads = (id) =>
  queryAsync("UPDATE lecturer_resources SET downloads = downloads + 1 WHERE id = ?", [id]);
