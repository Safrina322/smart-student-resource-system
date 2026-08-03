import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError.js";
import * as adminRepository from "../repositories/adminRepository.js";
import * as refreshTokenRepository from "../repositories/refreshTokenRepository.js";
import { isLockedOut, nextFailedAttemptState } from "../utils/accountLockout.js";

// `role: "admin"` stays a fixed generic tier for backward compatibility
// with adminAuth.js and anything else already checking for it;
// `adminRole` carries the granular dept_admin/sysadmin distinction for
// the new requireRole middleware.
// A dedicated secret for admin tokens so a bug or leak in the student-facing
// signing path can't be used to forge an admin token. Falls back to
// JWT_SECRET if ADMIN_JWT_SECRET isn't configured in a given environment,
// so this can roll out without breaking a deployment that hasn't set it yet.
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const signAccessToken = (admin) =>
  jwt.sign(
    { adminId: admin.id, role: "admin", adminRole: admin.role || "sysadmin" },
    ADMIN_JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

const generateToken = () => crypto.randomBytes(32).toString("hex");

const issueSession = async (admin) => {
  const accessToken = signAccessToken(admin);
  const refreshToken = generateToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

  await refreshTokenRepository.create({
    accountType: "admin",
    accountId: admin.id,
    tokenHash: refreshTokenRepository.hashToken(refreshToken),
    expiresAt,
  });

  return { accessToken, refreshToken, refreshMaxAgeMs: REFRESH_TOKEN_MAX_AGE_MS };
};

const toPublicAdmin = (admin) => ({
  id: admin.id,
  name: admin.name,
  email: admin.email,
  role: admin.role || "sysadmin",
});

export const login = async ({ email, password }) => {
  const admin = await adminRepository.findByEmail(email);
  if (!admin) {
    throw new AppError("Invalid credentials", 401);
  }

  if (isLockedOut(admin)) {
    throw new AppError("Too many failed attempts. Please try again in 15 minutes.", 423);
  }

  let isMatch;
  if (admin.password?.startsWith("$2")) {
    isMatch = await bcrypt.compare(password, admin.password);
  } else {
    // Legacy plaintext row — verify once, then upgrade to a bcrypt hash so
    // the admin password is never stored or compared in cleartext again.
    isMatch = password === admin.password;
    if (isMatch) {
      const upgradedHash = await bcrypt.hash(password, 10);
      await adminRepository.updatePassword(admin.id, upgradedHash);
    }
  }

  if (!isMatch) {
    const { attempts, lockoutUntil } = nextFailedAttemptState(admin);
    await adminRepository.recordFailedLogin(admin.id, attempts, lockoutUntil);
    throw new AppError("Invalid credentials", 401);
  }

  await adminRepository.resetLoginAttempts(admin.id);

  const session = await issueSession(admin);
  return {
    ...session,
    admin: toPublicAdmin(admin),
  };
};

export const refreshSession = async (refreshTokenRaw) => {
  if (!refreshTokenRaw) {
    throw new AppError("No session to refresh", 401);
  }

  const tokenHash = refreshTokenRepository.hashToken(refreshTokenRaw);
  const record = await refreshTokenRepository.findValid(tokenHash);
  if (!record || record.account_type !== "admin") {
    throw new AppError("Session expired. Please log in again.", 401);
  }

  await refreshTokenRepository.revoke(tokenHash);

  const admin = await adminRepository.findById(record.account_id);
  if (!admin) {
    throw new AppError("Session expired. Please log in again.", 401);
  }

  const accessToken = signAccessToken(admin);
  const refreshToken = generateToken();
  const refreshMaxAgeMs = Math.max(new Date(record.expires_at).getTime() - Date.now(), 0);

  await refreshTokenRepository.create({
    accountType: "admin",
    accountId: admin.id,
    tokenHash: refreshTokenRepository.hashToken(refreshToken),
    expiresAt: record.expires_at,
  });

  return {
    accessToken,
    refreshToken,
    refreshMaxAgeMs,
    admin: toPublicAdmin(admin),
  };
};

export const logoutAdmin = async (refreshTokenRaw) => {
  if (!refreshTokenRaw) return;
  await refreshTokenRepository.revoke(refreshTokenRepository.hashToken(refreshTokenRaw));
};

export const getAdminProfile = async (adminId) => {
  const admin = await adminRepository.findById(adminId);
  if (!admin) {
    throw new AppError("Admin not found", 404);
  }
  return toPublicAdmin(admin);
};
