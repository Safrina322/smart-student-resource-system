import * as adminAuthService from "../services/adminAuthService.js";
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_REFRESH_TOKEN_COOKIE,
  setSessionCookies,
  clearAllSessionCookies,
} from "../utils/cookies.js";

export const login = async (req, res) => {
  const { accessToken, refreshToken, refreshMaxAgeMs, admin } = await adminAuthService.login(
    req.body
  );

  clearAllSessionCookies(res);
  setSessionCookies(res, {
    accessCookieName: ADMIN_ACCESS_TOKEN_COOKIE,
    refreshCookieName: ADMIN_REFRESH_TOKEN_COOKIE,
    accessToken,
    refreshToken,
    refreshMaxAgeMs,
  });

  res.json({ message: "Login successful", admin });
};

export const refresh = async (req, res) => {
  const { accessToken, refreshToken, refreshMaxAgeMs, admin } = await adminAuthService.refreshSession(
    req.cookies?.[ADMIN_REFRESH_TOKEN_COOKIE]
  );

  setSessionCookies(res, {
    accessCookieName: ADMIN_ACCESS_TOKEN_COOKIE,
    refreshCookieName: ADMIN_REFRESH_TOKEN_COOKIE,
    accessToken,
    refreshToken,
    refreshMaxAgeMs,
  });

  res.json({ message: "Session refreshed", admin });
};

export const logout = async (req, res) => {
  await adminAuthService.logoutAdmin(req.cookies?.[ADMIN_REFRESH_TOKEN_COOKIE]);
  clearAllSessionCookies(res);
  res.json({ message: "Logged out" });
};

export const getMe = async (req, res) => {
  const admin = await adminAuthService.getAdminProfile(req.admin.adminId);
  res.json(admin);
};
