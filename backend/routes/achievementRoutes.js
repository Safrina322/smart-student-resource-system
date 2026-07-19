import express from "express";
import * as achievementController from "../controllers/achievementController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(achievementController.getAchievements));
router.get("/history", asyncHandler(achievementController.getActivityHistory));

export default router;
