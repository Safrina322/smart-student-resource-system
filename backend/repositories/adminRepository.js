import { queryAsync } from "../db.js";

export const findByEmail = async (email) => {
  const rows = await queryAsync("SELECT * FROM admin WHERE email = ?", [email]);
  return rows[0] || null;
};

export const updatePassword = async (adminId, hashedPassword) => {
  await queryAsync("UPDATE admin SET password = ? WHERE id = ?", [hashedPassword, adminId]);
};
