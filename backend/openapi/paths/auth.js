import { registerRoute } from "../registry.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
  updateSettingsSchema,
} from "../../validation/authValidation.js";
import { adminLoginSchema } from "../../validation/adminAuthValidation.js";

const tags = ["Auth"];

registerRoute({
  method: "post",
  path: "/api/auth/register",
  tags,
  summary: "Register a new student account",
  security: [],
  schema: registerSchema,
});

registerRoute({
  method: "post",
  path: "/api/auth/login",
  tags,
  summary: "Log in as a student/lecturer/moderator",
  security: [],
  schema: loginSchema,
});

registerRoute({
  method: "post",
  path: "/api/auth/refresh",
  tags,
  summary: "Rotate the refresh-token cookie for a new short-lived access token",
  security: [],
});

registerRoute({
  method: "post",
  path: "/api/auth/logout",
  tags,
  summary: "Revoke the current refresh token and clear session cookies",
  security: [],
});

registerRoute({
  method: "get",
  path: "/api/auth/verify-email/{token}",
  tags,
  summary: "Verify an account's email address",
  security: [],
  schema: verifyEmailSchema,
});

registerRoute({
  method: "post",
  path: "/api/auth/resend-verification",
  tags,
  summary: "Resend the email verification link",
  security: [],
  schema: resendVerificationSchema,
});

registerRoute({
  method: "post",
  path: "/api/auth/forgot-password",
  tags,
  summary: "Request a password reset link (account-enumeration-safe)",
  security: [],
  schema: forgotPasswordSchema,
});

registerRoute({
  method: "post",
  path: "/api/auth/reset-password",
  tags,
  summary: "Reset a password using a valid reset token",
  security: [],
  schema: resetPasswordSchema,
});

registerRoute({
  method: "get",
  path: "/api/auth/me",
  tags,
  summary: "Get the logged-in user's profile",
  security: [{ userAuth: [] }],
});

registerRoute({
  method: "put",
  path: "/api/auth/profile",
  tags,
  summary: "Update the logged-in user's profile",
  security: [{ userAuth: [] }],
  schema: updateProfileSchema,
});

registerRoute({
  method: "post",
  path: "/api/auth/change-password",
  tags,
  summary: "Change the logged-in user's password",
  security: [{ userAuth: [] }],
  schema: changePasswordSchema,
});

registerRoute({
  method: "get",
  path: "/api/auth/settings",
  tags,
  summary: "Get the logged-in user's app preferences",
  security: [{ userAuth: [] }],
});

registerRoute({
  method: "put",
  path: "/api/auth/settings",
  tags,
  summary: "Update the logged-in user's app preferences",
  security: [{ userAuth: [] }],
  schema: updateSettingsSchema,
});

registerRoute({
  method: "post",
  path: "/api/admin/login",
  tags,
  summary: "Log in as an admin (dept_admin or sysadmin)",
  security: [],
  schema: adminLoginSchema,
});

registerRoute({
  method: "post",
  path: "/api/admin/refresh",
  tags,
  summary: "Rotate the admin refresh-token cookie for a new short-lived access token",
  security: [],
});

registerRoute({
  method: "post",
  path: "/api/admin/logout",
  tags,
  summary: "Revoke the current admin refresh token and clear session cookies",
  security: [],
});

registerRoute({
  method: "get",
  path: "/api/admin/me",
  tags,
  summary: "Get the logged-in admin's profile",
  security: [{ adminAuth: [] }],
});
