import { z } from "zod";
import { registerRoute } from "../registry.js";
import { listRequestsQuerySchema } from "../../validation/adminRequestValidation.js";

const tags = ["Resource Requests"];

// requestRoutes.js predates this codebase's Zod validation convention (it
// validates inline in the controller body, and takes multipart/form-data
// for the optional cover image) - documented from the route's actual
// behavior rather than a schema that doesn't exist.
registerRoute({
  method: "post",
  path: "/api/requests",
  tags,
  summary:
    "Submit a resource request (multipart: title, subject, semester, type, resource_url, lesson_title, + optional image)",
  security: [{ userAuth: [] }],
});

registerRoute({
  method: "get",
  path: "/api/requests/mine",
  tags,
  summary: "List the logged-in student's own requests with their status timeline",
  security: [{ userAuth: [] }],
});

registerRoute({
  method: "get",
  path: "/api/admin/requests",
  tags,
  summary: "List pending resource requests (admin, paginated)",
  security: [{ adminAuth: [] }],
  schema: listRequestsQuerySchema,
});

const requestIdParams = z.object({ params: z.object({ id: z.coerce.number().int().positive() }) });

registerRoute({
  method: "put",
  path: "/api/admin/requests/{id}/approve",
  tags,
  summary: "Approve a resource request",
  security: [{ adminAuth: [] }],
  schema: requestIdParams,
});

registerRoute({
  method: "put",
  path: "/api/admin/requests/{id}/reject",
  tags,
  summary: "Reject a resource request",
  security: [{ adminAuth: [] }],
  schema: requestIdParams,
});
