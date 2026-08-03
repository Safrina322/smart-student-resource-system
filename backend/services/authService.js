import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import * as userRepository from "../repositories/userRepository.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/mailer.js";

const REMEMBER_ME_EXPIRY = "30d";
const DEFAULT_EXPIRY = "1h";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const signToken = (user, { rememberMe = false } = {}) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? REMEMBER_ME_EXPIRY : DEFAULT_EXPIRY,
  });

const generateToken = () => crypto.randomBytes(32).toString("hex");

const toPublicProfile = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  firstName: user.first_name,
  lastName: user.last_name,
  phone: user.phone,
  semester: user.semester,
  courseBranch: user.course_branch,
  emailVerified: Boolean(user.email_verified),
});

export const register = async ({ username, email, password }) => {
  const existing = await userRepository.findByUsername(username);
  if (existing) {
    throw new AppError("Username already taken", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = generateToken();
  await userRepository.createUser({ username, email, hashedPassword, verificationToken });

  // Best-effort: registration should still succeed even if SMTP is down or
  // unconfigured in this environment.
  try {
    await sendVerificationEmail({ to: email, name: username, token: verificationToken });
  } catch (err) {
    console.error("⚠️ Failed to send verification email:", err.message);
  }
};

export const login = async ({ username, password, rememberMe = false }) => {
  const user = await userRepository.findByUsername(username);
  if (!user) {
    throw new AppError("Invalid username or password", 401);
  }

  let isMatch;
  if (user.password?.startsWith("$2")) {
    isMatch = await bcrypt.compare(password, user.password);
  } else {
    // Legacy plaintext row — verify against the raw value once, then
    // transparently upgrade it to a bcrypt hash so it never happens again.
    isMatch = password === user.password;
    if (isMatch) {
      const upgradedHash = await bcrypt.hash(password, 10);
      await userRepository.updatePassword(user.id, upgradedHash);
    }
  }

  if (!isMatch) {
    throw new AppError("Invalid username or password", 401);
  }

  const token = signToken(user, { rememberMe });
  return {
    token,
    user: { id: user.id, username: user.username, role: user.role },
  };
};

export const verifyEmail = async (token) => {
  const user = await userRepository.findByVerificationToken(token);
  if (!user) {
    throw new AppError("Invalid or expired verification link", 400);
  }

  await userRepository.markEmailVerified(user.id);
};

export const resendVerificationEmail = async (email) => {
  const user = await userRepository.findByEmail(email);
  // Same response whether or not the account exists, and whether or not
  // it's already verified, so this endpoint can't be used to probe emails.
  if (!user || user.email_verified) {
    return;
  }

  const verificationToken = generateToken();
  await userRepository.setVerificationToken(user.id, verificationToken);

  try {
    await sendVerificationEmail({ to: user.email, name: user.username, token: verificationToken });
  } catch (err) {
    console.error("⚠️ Failed to resend verification email:", err.message);
  }
};

export const requestPasswordReset = async (email) => {
  const user = await userRepository.findByEmail(email);
  // Always behave the same way regardless of whether the email is
  // registered, so this endpoint can't be used to enumerate accounts.
  if (!user) {
    return;
  }

  const resetToken = generateToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await userRepository.setPasswordResetToken(user.id, resetToken, expiresAt);

  try {
    await sendPasswordResetEmail({ to: user.email, name: user.username, token: resetToken });
  } catch (err) {
    console.error("⚠️ Failed to send password reset email:", err.message);
  }
};

export const resetPassword = async ({ token, newPassword }) => {
  const user = await userRepository.findByValidResetToken(token);
  if (!user) {
    throw new AppError("Invalid or expired reset link", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userRepository.updatePassword(user.id, hashedPassword);
  await userRepository.clearPasswordResetToken(user.id);
};

export const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = user.password?.startsWith("$2")
    ? await bcrypt.compare(currentPassword, user.password)
    : currentPassword === user.password;

  if (!isMatch) {
    throw new AppError("Current password is incorrect", 401);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await userRepository.updatePassword(user.id, hashedPassword);
};

export const getProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return toPublicProfile(user);
};

export const updateProfile = async (userId, { firstName, lastName, phone, semester, courseBranch }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  await userRepository.updateProfile(userId, { firstName, lastName, phone, semester, courseBranch });
  return getProfile(userId);
};

export const getSettings = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return { emailNotificationsEnabled: Boolean(user.email_notifications_enabled) };
};

export const updateSettings = async (userId, { emailNotificationsEnabled }) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  await userRepository.updateEmailNotificationSetting(userId, emailNotificationsEnabled);
  return getSettings(userId);
};
