import { queryAsync } from "../db.js";

export const findRecent = (limit = 100) =>
  queryAsync(
    `SELECT
      l.id, l.admin_id, a.name AS admin_name, a.email AS admin_email,
      l.action_type, l.target_type, l.target_id, l.details, l.created_at
     FROM admin_audit_logs l
     LEFT JOIN admin a ON a.id = l.admin_id
     ORDER BY l.created_at DESC
     LIMIT ${Number(limit) || 100}`
  );
