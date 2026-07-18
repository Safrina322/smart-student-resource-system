import express from "express";
import * as resourceHubController from "../controllers/resourceHubController.js";
import {
  listResourcesQuerySchema,
  resourceIdParamSchema,
  addCommentSchema,
  commentIdParamSchema,
  rateResourceSchema,
} from "../validation/resourceHubValidation.js";
import validate from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import authMiddleware from "../middleware/authMiddleware.js";
import optionalAuth from "../middleware/optionalAuth.js";

const router = express.Router();

// Browsing is public - it only ever surfaces already-approved resources.
router.get("/", validate(listResourcesQuerySchema), asyncHandler(resourceHubController.list));
router.get("/bookmarks/mine", authMiddleware, asyncHandler(resourceHubController.myBookmarks));
router.get("/:id", validate(resourceIdParamSchema), asyncHandler(resourceHubController.detail));

router.post(
  "/:id/download",
  authMiddleware,
  validate(resourceIdParamSchema),
  asyncHandler(resourceHubController.download)
);

router.get(
  "/:id/comments",
  validate(resourceIdParamSchema),
  asyncHandler(resourceHubController.listComments)
);
router.post(
  "/:id/comments",
  authMiddleware,
  validate(addCommentSchema),
  asyncHandler(resourceHubController.addComment)
);
router.delete(
  "/comments/:commentId",
  authMiddleware,
  validate(commentIdParamSchema),
  asyncHandler(resourceHubController.deleteComment)
);

router.get(
  "/:id/rating",
  optionalAuth,
  validate(resourceIdParamSchema),
  asyncHandler(resourceHubController.ratingSummary)
);
router.post(
  "/:id/rating",
  authMiddleware,
  validate(rateResourceSchema),
  asyncHandler(resourceHubController.rate)
);

router.post(
  "/:id/bookmark",
  authMiddleware,
  validate(resourceIdParamSchema),
  asyncHandler(resourceHubController.toggleBookmark)
);

export default router;
