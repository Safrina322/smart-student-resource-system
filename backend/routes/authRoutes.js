import express from "express";
import * as authController from "../controllers/authController.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} from "../validation/authValidation.js";
import validate from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), asyncHandler(authController.register));
router.post("/login", authLimiter, validate(loginSchema), asyncHandler(authController.login));

router.get(
  "/verify-email/:token",
  validate(verifyEmailSchema),
  asyncHandler(authController.verifyEmail)
);
router.post(
  "/resend-verification",
  authLimiter,
  validate(resendVerificationSchema),
  asyncHandler(authController.resendVerification)
);

router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  asyncHandler(authController.forgotPassword)
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  asyncHandler(authController.resetPassword)
);

router.get("/me", authMiddleware, asyncHandler(authController.getMe));
router.put(
  "/profile",
  authMiddleware,
  validate(updateProfileSchema),
  asyncHandler(authController.updateProfile)
);
router.post(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

export default router;
