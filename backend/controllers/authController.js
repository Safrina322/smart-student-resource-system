import * as authService from "../services/authService.js";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  setSessionCookies,
  clearAllSessionCookies,
} from "../utils/cookies.js";

export const register = async (req, res) => {
  await authService.register(req.body);
  res.json({ message: "Registered successfully. Check your email to verify your account." });
};

export const login = async (req, res) => {
  const { accessToken, refreshToken, refreshMaxAgeMs, user } = await authService.login(req.body);

  clearAllSessionCookies(res);
  setSessionCookies(res, {
    accessCookieName: ACCESS_TOKEN_COOKIE,
    refreshCookieName: REFRESH_TOKEN_COOKIE,
    accessToken,
    refreshToken,
    refreshMaxAgeMs,
  });

  res.json({ message: "Login successful", user });
};

export const refresh = async (req, res) => {
  const { accessToken, refreshToken, refreshMaxAgeMs, user } = await authService.refreshSession(
    req.cookies?.[REFRESH_TOKEN_COOKIE]
  );

  setSessionCookies(res, {
    accessCookieName: ACCESS_TOKEN_COOKIE,
    refreshCookieName: REFRESH_TOKEN_COOKIE,
    accessToken,
    refreshToken,
    refreshMaxAgeMs,
  });

  res.json({ message: "Session refreshed", user });
};

export const logout = async (req, res) => {
  await authService.logoutUser(req.cookies?.[REFRESH_TOKEN_COOKIE]);
  clearAllSessionCookies(res);
  res.json({ message: "Logged out" });
};

export const verifyEmail = async (req, res) => {
  await authService.verifyEmail(req.params.token);
  res.json({ message: "Email verified successfully. You can now log in." });
};

export const resendVerification = async (req, res) => {
  await authService.resendVerificationEmail(req.body.email);
  res.json({ message: "If that email is registered and unverified, a new link has been sent." });
};

export const forgotPassword = async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  res.json({ message: "If that email is registered, a password reset link has been sent." });
};

export const resetPassword = async (req, res) => {
  await authService.resetPassword(req.body);
  res.json({ message: "Password reset successfully. You can now log in." });
};

export const changePassword = async (req, res) => {
  await authService.changePassword({ userId: req.user.id, ...req.body });
  res.json({ message: "Password changed successfully." });
};

export const getMe = async (req, res) => {
  const profile = await authService.getProfile(req.user.id);
  res.json(profile);
};

export const updateProfile = async (req, res) => {
  const profile = await authService.updateProfile(req.user.id, req.body);
  res.json({ message: "Profile updated successfully.", profile });
};

export const getSettings = async (req, res) => {
  const settings = await authService.getSettings(req.user.id);
  res.json(settings);
};

export const updateSettings = async (req, res) => {
  const settings = await authService.updateSettings(req.user.id, req.body);
  res.json({ message: "Settings updated successfully.", settings });
};
