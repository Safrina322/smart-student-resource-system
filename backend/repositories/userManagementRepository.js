import { queryAsync } from "../db.js";

const SAFE_COLUMNS = `
  id, username, email, role, first_name, last_name, phone,
  semester, course_branch, is_active, email_verified, created_at
`;

export const findAll = ({ role, status, search }) => {
  const conditions = [];
  const params = [];

  if (role) {
    conditions.push("role = ?");
    params.push(role);
  }

  if (status === "active") {
    conditions.push("is_active = 1");
  } else if (status === "inactive") {
    conditions.push("is_active = 0");
  }

  if (search) {
    conditions.push("(username LIKE ? OR email LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  return queryAsync(
    `SELECT ${SAFE_COLUMNS} FROM users ${whereClause} ORDER BY created_at DESC LIMIT 200`,
    params
  );
};

export const findById = async (id) => {
  const rows = await queryAsync(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`, [id]);
  return rows[0] || null;
};

export const updateRole = (id, role) => queryAsync("UPDATE users SET role = ? WHERE id = ?", [role, id]);

export const updateStatus = (id, isActive) =>
  queryAsync("UPDATE users SET is_active = ? WHERE id = ?", [isActive ? 1 : 0, id]);
