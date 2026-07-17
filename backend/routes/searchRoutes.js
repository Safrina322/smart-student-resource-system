import express from "express";
import * as searchController from "../controllers/searchController.js";
import { searchQuerySchema, popularSearchQuerySchema } from "../validation/searchValidation.js";
import validate from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

// Public: search only surfaces already-public data (resources, courses,
// approved lecturer resources), so no auth is required.
router.get("/", validate(searchQuerySchema), asyncHandler(searchController.search));
router.get("/popular", validate(popularSearchQuerySchema), asyncHandler(searchController.popular));

export default router;
