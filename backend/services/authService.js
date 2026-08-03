import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import * as userRepository from "../repositories/userRepository.js";
import * as refreshTokenRepository from "../repositories/refreshTokenRepository.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/mailer.js";
import logger from "../utils/logger.js";
import { isLockedOut, nextFailedAttemptState } from "../utils/accountLockout.js";

// Access tokens are short-lived by design - they're the one credential a
// stolen cookie value could be replayed with, so keeping the window small
// limits the damage. "Remember me" now controls the refresh token's
// lifetime instead, not the access token's.
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const REMEMBER_ME_REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const signAccessToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

const generateToken = () => crypto.randomBytes(32).toString("hex");

// Issues a fresh access token + a new, hashed-and-stored refresh token for
// a user. Shared by both login and refresh so the two paths can't drift.
const issueSession = async (user, { rememberMe = false } = {}) => {
  const accessToken = signAccessToken(user);
  const refreshToken = generateToken();
  const refreshMaxAgeMs = rememberMe ? REMEMBER_ME_REFRESH_MAX_AGE_MS : REFRESH_TOKEN_MAX_AGE_MS;
  const expiresAt = new Date(Date.now() + refreshMaxAgeMs);

  await refreshTokenRepository.create({
    accountType: "user",
    accountId: user.id,
    tokenHash: refreshTokenRepository.hashToken(refreshToken),
    expiresAt,
  });

  return { accessToken, refreshToken, refreshMaxAgeMs };
};

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
    logger.warn({ err }, "Failed to send verification email");
  }
};

export const login = async ({ username, password, rememberMe = false }) => {
  const user = await userRepository.findByUsername(username);
  if (!user) {
    throw new AppError("Invalid username or password", 401);
  }

  if (isLockedOut(user)) {
    throw new AppError("Too many failed attempts. Please try again in 15 minutes.", 423);
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
    const { attempts, lockoutUntil } = nextFailedAttemptState(user);
    await userRepository.recordFailedLogin(user.id, attempts, lockoutUntil);
    throw new AppError("Invalid username or password", 401);
  }

  await userRepository.resetLoginAttempts(user.id);

  const session = await issueSession(user, { rememberMe });
  return {
    ...session,
    user: { id: user.id, username: user.username, role: user.role },
  };
};

// Rotates the refresh token on every use (old one revoked, new one issued)
// so a stolen-then-replayed refresh token is only usable once - the
// legitimate owner's next refresh attempt would fail, which is a visible
// signal something is wrong, rather than a silently-shared valid token.
// Preserves the ORIGINAL absolute expiry rather than extending it on each
// refresh, so a session can't be kept alive forever just by staying active.
export const refreshSession = async (refreshTokenRaw) => {
  if (!refreshTokenRaw) {
    throw new AppError("No session to refresh", 401);
  }

  const tokenHash = refreshTokenRepository.hashToken(refreshTokenRaw);
  const record = await refreshTokenRepository.findValid(tokenHash);
  if (!record) {
    throw new AppError("Session expired. Please log in again.", 401);
  }

  await refreshTokenRepository.revoke(tokenHash);

  const user = await userRepository.findById(record.account_id);
  if (!user) {
    throw new AppError("Session expired. Please log in again.", 401);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = generateToken();
  const refreshMaxAgeMs = Math.max(new Date(record.expires_at).getTime() - Date.now(), 0);

  await refreshTokenRepository.create({
    accountType: "user",
    accountId: user.id,
    tokenHash: refreshTokenRepository.hashToken(refreshToken),
    expiresAt: record.expires_at,
  });

  return {
    accessToken,
    refreshToken,
    refreshMaxAgeMs,
    user: { id: user.id, username: user.username, role: user.role },
  };
};

export const logoutUser = async (refreshTokenRaw) => {
  if (!refreshTokenRaw) return;
  await refreshTokenRepository.revoke(refreshTokenRepository.hashToken(refreshTokenRaw));
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
    logger.warn({ err }, "Failed to resend verification email");
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
    logger.warn({ err }, "Failed to send password reset email");
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
  await refreshTokenRepository.revokeAllForAccount("user", user.id);
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
  // Changing the password is a strong signal to end every other session,
  // not just leave old refresh tokens usable until they naturally expire.
  await refreshTokenRepository.revokeAllForAccount("user", user.id);
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
