import express from "express";
import * as analyticsEventController from "../controllers/analyticsEventController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/events", authMiddleware, asyncHandler(analyticsEventController.trackEvent));

export default router;
