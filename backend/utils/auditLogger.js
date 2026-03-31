import db from "../db.js";

export const logAdminAction = ({
  adminId = null,
  actionType,
  targetType,
  targetId = null,
  details = null,
}) => {
  if (!actionType || !targetType) {
    return;
  }

  db.query(
    `INSERT INTO admin_audit_logs (admin_id, action_type, target_type, target_id, details)
     VALUES (?, ?, ?, ?, ?)`,
    [adminId, actionType, targetType, targetId, details],
    (err) => {
      if (err) {
        console.error("⚠️ Audit log write warning:", err.message);
      }
    }
  );
};
