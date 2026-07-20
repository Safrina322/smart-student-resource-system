import express from "express";
import * as aiController from "../controllers/aiController.js";
import {
  resourceIdParamSchema,
  quizQuerySchema,
  flashcardsQuerySchema,
  chatSchema,
  studyPlanSchema,
  searchAssistSchema,
} from "../validation/aiValidation.js";
import validate from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Search assist rides on the same public search data as /api/search - no
// auth required, matching that route's access model.
router.post("/search-assist", validate(searchAssistSchema), asyncHandler(aiController.searchAssist));

router.use(authMiddleware);

router.get(
  "/resources/:id/summary",
  validate(resourceIdParamSchema),
  asyncHandler(aiController.summary)
);
router.get("/resources/:id/quiz", validate(quizQuerySchema), asyncHandler(aiController.quiz));
router.get(
  "/resources/:id/flashcards",
  validate(flashcardsQuerySchema),
  asyncHandler(aiController.flashcards)
);
router.post("/resources/:id/chat", validate(chatSchema), asyncHandler(aiController.chat));

router.post("/study-plan", validate(studyPlanSchema), asyncHandler(aiController.studyPlan));
router.get("/recommendations", asyncHandler(aiController.recommendations));

export default router;
