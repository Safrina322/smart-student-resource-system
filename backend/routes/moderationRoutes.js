import express from "express";
import * as moderationController from "../controllers/moderationController.js";
import { reviewResourceSchema, reviewQueueQuerySchema } from "../validation/lecturerResourceValidation.js";
import validate from "../middleware/validate.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.use(authMiddleware, requireRole("moderator"));

router.get("/resources", validate(reviewQueueQuerySchema), asyncHandler(moderationController.listQueue));
router.post(
  "/resources/:id/approve",
  validate(reviewResourceSchema),
  asyncHandler(moderationController.approve)
);
router.post(
  "/resources/:id/reject",
  validate(reviewResourceSchema),
  asyncHandler(moderationController.reject)
);
router.post(
  "/resources/:id/flag",
  validate(reviewResourceSchema),
  asyncHandler(moderationController.flag)
);

export default router;
