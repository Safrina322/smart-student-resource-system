import express from "express";
import * as healthController from "../controllers/healthController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", asyncHandler(healthController.check));

export default router;
