import { queryAsync } from "../db.js";

export const findById = async (id) => {
  const rows = await queryAsync("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0] || null;
};

export const findByUsername = async (username) => {
  const rows = await queryAsync("SELECT * FROM users WHERE username = ?", [username]);
  return rows[0] || null;
};

export const findByEmail = async (email) => {
  const rows = await queryAsync("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null;
};

export const findByVerificationToken = async (token) => {
  const rows = await queryAsync("SELECT * FROM users WHERE email_verification_token = ?", [token]);
  return rows[0] || null;
};

export const findByValidResetToken = async (token) => {
  const rows = await queryAsync(
    "SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()",
    [token]
  );
  return rows[0] || null;
};

export const createUser = async ({ username, email, hashedPassword, verificationToken }) => {
  const result = await queryAsync(
    "INSERT INTO users (username, email, password, email_verification_token) VALUES (?, ?, ?, ?)",
    [username, email, hashedPassword, verificationToken]
  );
  return result.insertId;
};

export const updatePassword = async (userId, hashedPassword) => {
  await queryAsync("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);
};

export const markEmailVerified = async (userId) => {
  await queryAsync(
    "UPDATE users SET email_verified = 1, email_verification_token = NULL WHERE id = ?",
    [userId]
  );
};

export const setVerificationToken = async (userId, token) => {
  await queryAsync("UPDATE users SET email_verification_token = ? WHERE id = ?", [token, userId]);
};

export const setPasswordResetToken = async (userId, token, expiresAt) => {
  await queryAsync(
    "UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?",
    [token, expiresAt, userId]
  );
};

export const clearPasswordResetToken = async (userId) => {
  await queryAsync(
    "UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?",
    [userId]
  );
};

export const updateProfile = async (userId, { firstName, lastName, phone, semester, courseBranch }) => {
  await queryAsync(
    `UPDATE users
     SET first_name = ?, last_name = ?, phone = ?, semester = ?, course_branch = ?
     WHERE id = ?`,
    [firstName ?? null, lastName ?? null, phone ?? null, semester ?? null, courseBranch ?? null, userId]
  );
};

export const updateEmailNotificationSetting = async (userId, enabled) => {
  await queryAsync("UPDATE users SET email_notifications_enabled = ? WHERE id = ?", [
    enabled ? 1 : 0,
    userId,
  ]);
};
