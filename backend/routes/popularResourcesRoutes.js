import express from "express";
import * as popularResourceController from "../controllers/popularResourceController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/popular-courses", asyncHandler(popularResourceController.popularCourses));
router.get("/popular-lessons/:courseId", asyncHandler(popularResourceController.popularLessons));
router.get("/trending", asyncHandler(popularResourceController.trending));

export default router;
