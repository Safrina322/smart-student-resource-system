import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as auditLogController from "../controllers/auditLogController.js";

const router = express.Router();

router.get("/logs", adminAuth, asyncHandler(auditLogController.listRecent));

export default router;
