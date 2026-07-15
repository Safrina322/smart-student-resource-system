import express from "express";
import * as adminAuthController from "../controllers/adminAuthController.js";
import { adminLoginSchema } from "../validation/adminAuthValidation.js";
import validate from "../middleware/validate.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.post("/login", authLimiter, validate(adminLoginSchema), asyncHandler(adminAuthController.login));

export default router;
