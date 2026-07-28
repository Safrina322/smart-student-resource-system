import { registerRoute } from "../registry.js";
import {
  resourceIdParamSchema,
  quizQuerySchema,
  flashcardsQuerySchema,
  chatSchema,
  studyPlanSchema,
  searchAssistSchema,
} from "../../validation/aiValidation.js";

const tags = ["AI"];

const rateLimited = (description) => ({
  429: { description },
});

registerRoute({
  method: "post",
  path: "/api/ai/search-assist",
  tags,
  summary: "AI-synthesized answer from live search results (public, IP rate-limited)",
  security: [],
  schema: searchAssistSchema,
  extraResponses: rateLimited("Too many AI requests from this IP - see aiPublicLimiter"),
});

registerRoute({
  method: "get",
  path: "/api/ai/resources/{id}/summary",
  tags,
  summary: "Grounded AI summary of a resource (cached per resource)",
  security: [{ userAuth: [] }],
  schema: resourceIdParamSchema,
  extraResponses: rateLimited("Too many AI requests from this account - see aiLimiter"),
});

registerRoute({
  method: "get",
  path: "/api/ai/resources/{id}/quiz",
  tags,
  summary: "AI-generated quiz for a resource (cached per resource)",
  security: [{ userAuth: [] }],
  schema: quizQuerySchema,
  extraResponses: rateLimited("Too many AI requests from this account - see aiLimiter"),
});

registerRoute({
  method: "get",
  path: "/api/ai/resources/{id}/flashcards",
  tags,
  summary: "AI-generated flashcards for a resource (cached per resource)",
  security: [{ userAuth: [] }],
  schema: flashcardsQuerySchema,
  extraResponses: rateLimited("Too many AI requests from this account - see aiLimiter"),
});

registerRoute({
  method: "post",
  path: "/api/ai/resources/{id}/chat",
  tags,
  summary: "Chat about a resource, grounded in its real content (not cached)",
  security: [{ userAuth: [] }],
  schema: chatSchema,
  extraResponses: rateLimited("Too many AI requests from this account - see aiLimiter"),
});

registerRoute({
  method: "post",
  path: "/api/ai/study-plan",
  tags,
  summary: "Generate a week-by-week AI study plan from the student's enrolled courses",
  security: [{ userAuth: [] }],
  schema: studyPlanSchema,
  extraResponses: rateLimited("Too many AI requests from this account - see aiLimiter"),
});

registerRoute({
  method: "get",
  path: "/api/ai/recommendations",
  tags,
  summary: "Grounded resource recommendations from the student's real engagement history",
  security: [{ userAuth: [] }],
  extraResponses: rateLimited("Too many AI requests from this account - see aiLimiter"),
});
