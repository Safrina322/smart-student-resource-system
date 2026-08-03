import express from "express";
import * as adminAuthController from "../controllers/adminAuthController.js";
import { adminLoginSchema } from "../validation/adminAuthValidation.js";
import validate from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/login", authLimiter, validate(adminLoginSchema), asyncHandler(adminAuthController.login));
router.post("/refresh", authLimiter, asyncHandler(adminAuthController.refresh));
router.post("/logout", asyncHandler(adminAuthController.logout));
router.get("/me", adminAuth, asyncHandler(adminAuthController.getMe));

export default router;
