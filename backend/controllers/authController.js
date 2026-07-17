import * as authService from "../services/authService.js";

export const register = async (req, res) => {
  await authService.register(req.body);
  res.json({ message: "Registered successfully. Check your email to verify your account." });
};

export const login = async (req, res) => {
  const result = await authService.login(req.body);
  res.json({ message: "Login successful", ...result });
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
