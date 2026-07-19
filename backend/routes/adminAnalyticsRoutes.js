import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as adminAnalyticsController from "../controllers/adminAnalyticsController.js";

const router = express.Router();

router.use(adminAuth);

router.get("/summary", asyncHandler(adminAnalyticsController.summary));
router.get("/trends", asyncHandler(adminAnalyticsController.trends));
router.get("/report", asyncHandler(adminAnalyticsController.report));
router.get("/report/history", asyncHandler(adminAnalyticsController.reportHistory));
router.get("/report/schedules", asyncHandler(adminAnalyticsController.getSchedule));
router.post("/report/schedules", asyncHandler(adminAnalyticsController.saveSchedule));
router.delete("/report/schedules/:id", asyncHandler(adminAnalyticsController.deleteSchedule));

export default router;
