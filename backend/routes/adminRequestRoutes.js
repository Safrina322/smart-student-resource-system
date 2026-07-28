import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as adminRequestController from "../controllers/adminRequestController.js";
import { listRequestsQuerySchema } from "../validation/adminRequestValidation.js";
import validate from "../middleware/validate.js";

const router = express.Router();

router.use(adminAuth);

router.get("/", validate(listRequestsQuerySchema), asyncHandler(adminRequestController.list));
router.put("/:id/approve", asyncHandler(adminRequestController.approve));
router.put("/:id/reject", asyncHandler(adminRequestController.reject));

export default router;
