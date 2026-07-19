import express from "express";
import * as notificationController from "../controllers/notificationController.js";
import { notificationIdParamSchema } from "../validation/notificationValidation.js";
import validate from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", asyncHandler(notificationController.list));
router.patch(
  "/:id/read",
  validate(notificationIdParamSchema),
  asyncHandler(notificationController.markRead)
);
router.patch("/read-all", asyncHandler(notificationController.markAllRead));

export default router;
