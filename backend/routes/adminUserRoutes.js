import express from "express";
import * as userManagementController from "../controllers/userManagementController.js";
import {
  listUsersQuerySchema,
  changeRoleSchema,
  changeStatusSchema,
} from "../validation/userManagementValidation.js";
import validate from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.use(adminAuth);

router.get("/", validate(listUsersQuerySchema), asyncHandler(userManagementController.listUsers));
router.patch(
  "/:id/role",
  validate(changeRoleSchema),
  asyncHandler(userManagementController.changeRole)
);
router.patch(
  "/:id/status",
  validate(changeStatusSchema),
  asyncHandler(userManagementController.changeStatus)
);

export default router;
