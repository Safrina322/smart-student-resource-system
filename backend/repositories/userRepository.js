import { queryAsync } from "../db.js";

export const findByUsername = async (username) => {
  const rows = await queryAsync("SELECT * FROM users WHERE username = ?", [username]);
  return rows[0] || null;
};

export const findByEmail = async (email) => {
  const rows = await queryAsync("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0] || null;
};

export const createUser = async ({ username, email, hashedPassword }) => {
  const result = await queryAsync(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashedPassword]
  );
  return result.insertId;
};

export const updatePassword = async (userId, hashedPassword) => {
  await queryAsync("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);
};
