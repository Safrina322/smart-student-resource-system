import express from "express";
import * as courseController from "../controllers/courseController.js";
import { courseIdParamSchema } from "../validation/courseValidation.js";
import validate from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", asyncHandler(courseController.list));
router.get("/:id", validate(courseIdParamSchema), asyncHandler(courseController.getOne));
router.get(
  "/:id/lessons",
  validate(courseIdParamSchema),
  asyncHandler(courseController.getLessons)
);

export default router;
