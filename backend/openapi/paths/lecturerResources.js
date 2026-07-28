import { registerRoute } from "../registry.js";
import {
  uploadResourceSchema,
  updateResourceSchema,
  resourceIdParamSchema,
  reviewResourceSchema,
  reviewQueueQuerySchema,
} from "../../validation/lecturerResourceValidation.js";

// Both role-gated routers sit behind the standard student-side token
// (userAuth) plus a requireRole() check - there's no separate "lecturer" or
// "moderator" security scheme, the restriction is an application-level role
// check, so it's called out in each summary instead.
const lecturerTags = ["Lecturer Resources"];
const moderationTags = ["Moderation"];

registerRoute({
  method: "get",
  path: "/api/lecturer/resources",
  tags: lecturerTags,
  summary: "[lecturer role] List the logged-in lecturer's own uploads",
  security: [{ userAuth: [] }],
});

registerRoute({
  method: "get",
  path: "/api/lecturer/resources/analytics",
  tags: lecturerTags,
  summary: "[lecturer role] View engagement analytics across the lecturer's uploads",
  security: [{ userAuth: [] }],
});

registerRoute({
  method: "post",
  path: "/api/lecturer/resources",
  tags: lecturerTags,
  summary: "[lecturer role] Upload a new resource",
  security: [{ userAuth: [] }],
  schema: uploadResourceSchema,
  extraResponses: { 201: { description: "Resource created (pending review)" } },
});

registerRoute({
  method: "put",
  path: "/api/lecturer/resources/{id}",
  tags: lecturerTags,
  summary: "[lecturer role] Update the logged-in lecturer's own resource",
  security: [{ userAuth: [] }],
  schema: updateResourceSchema,
});

registerRoute({
  method: "delete",
  path: "/api/lecturer/resources/{id}",
  tags: lecturerTags,
  summary: "[lecturer role] Delete the logged-in lecturer's own resource",
  security: [{ userAuth: [] }],
  schema: resourceIdParamSchema,
});

registerRoute({
  method: "get",
  path: "/api/moderation/resources",
  tags: moderationTags,
  summary: "[moderator role] List the review queue, optionally filtered by status",
  security: [{ userAuth: [] }],
  schema: reviewQueueQuerySchema,
});

registerRoute({
  method: "post",
  path: "/api/moderation/resources/{id}/approve",
  tags: moderationTags,
  summary: "[moderator role] Approve a pending resource",
  security: [{ userAuth: [] }],
  schema: reviewResourceSchema,
});

registerRoute({
  method: "post",
  path: "/api/moderation/resources/{id}/reject",
  tags: moderationTags,
  summary: "[moderator role] Reject a pending resource",
  security: [{ userAuth: [] }],
  schema: reviewResourceSchema,
});

registerRoute({
  method: "post",
  path: "/api/moderation/resources/{id}/flag",
  tags: moderationTags,
  summary: "[moderator role] Flag a previously-approved resource",
  security: [{ userAuth: [] }],
  schema: reviewResourceSchema,
});
