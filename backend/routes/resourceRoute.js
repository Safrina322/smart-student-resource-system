import express from "express";
import * as resourceController from "../controllers/resourceController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

router.get("/", asyncHandler(resourceController.listRecent));

export default router;
