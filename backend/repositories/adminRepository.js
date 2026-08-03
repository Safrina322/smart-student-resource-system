import { queryAsync } from "../db.js";

export const findByEmail = async (email) => {
  const rows = await queryAsync("SELECT * FROM admin WHERE email = ?", [email]);
  return rows[0] || null;
};

export const updatePassword = async (adminId, hashedPassword) => {
  await queryAsync("UPDATE admin SET password = ? WHERE id = ?", [hashedPassword, adminId]);
};

export const recordFailedLogin = async (adminId, attempts, lockoutUntil) => {
  await queryAsync("UPDATE admin SET failed_login_attempts = ?, lockout_until = ? WHERE id = ?", [
    attempts,
    lockoutUntil,
    adminId,
  ]);
};

export const resetLoginAttempts = async (adminId) => {
  await queryAsync(
    "UPDATE admin SET failed_login_attempts = 0, lockout_until = NULL WHERE id = ?",
    [adminId]
  );
};
