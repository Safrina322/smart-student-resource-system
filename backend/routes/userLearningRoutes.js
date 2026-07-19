import express from "express";
import * as learningProgressController from "../controllers/learningProgressController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/track-access", asyncHandler(learningProgressController.trackAccess));
router.get("/continue-learning", asyncHandler(learningProgressController.continueLearning));

export default router;
