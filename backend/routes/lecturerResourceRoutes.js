import express from "express";
import * as lecturerResourceController from "../controllers/lecturerResourceController.js";
import {
  uploadResourceSchema,
  updateResourceSchema,
  resourceIdParamSchema,
} from "../validation/lecturerResourceValidation.js";
import validate from "../middleware/validate.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requireRole from "../middleware/requireRole.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.use(authMiddleware, requireRole("lecturer"));

router.get("/", asyncHandler(lecturerResourceController.listMine));
router.get("/analytics", asyncHandler(lecturerResourceController.analytics));
router.post("/", validate(uploadResourceSchema), asyncHandler(lecturerResourceController.upload));
router.put(
  "/:id",
  validate(updateResourceSchema),
  asyncHandler(lecturerResourceController.update)
);
router.delete(
  "/:id",
  validate(resourceIdParamSchema),
  asyncHandler(lecturerResourceController.remove)
);

export default router;
