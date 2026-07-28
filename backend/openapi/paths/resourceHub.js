import { registerRoute } from "../registry.js";
import {
  listResourcesQuerySchema,
  resourceIdParamSchema,
  addCommentSchema,
  commentIdParamSchema,
  rateResourceSchema,
} from "../../validation/resourceHubValidation.js";

const tags = ["Resource Hub"];

registerRoute({
  method: "get",
  path: "/api/resource-hub",
  tags,
  summary: "Browse approved lecturer-published resources (public, paginated)",
  security: [],
  schema: listResourcesQuerySchema,
});

registerRoute({
  method: "get",
  path: "/api/resource-hub/bookmarks/mine",
  tags,
  summary: "List the logged-in student's bookmarked resources",
  security: [{ userAuth: [] }],
});

registerRoute({
  method: "get",
  path: "/api/resource-hub/{id}",
  tags,
  summary: "Get a resource's detail",
  security: [],
  schema: resourceIdParamSchema,
});

registerRoute({
  method: "post",
  path: "/api/resource-hub/{id}/download",
  tags,
  summary: "Record a download and get the resource link",
  security: [{ userAuth: [] }],
  schema: resourceIdParamSchema,
});

registerRoute({
  method: "get",
  path: "/api/resource-hub/{id}/comments",
  tags,
  summary: "List a resource's comments (public)",
  security: [],
  schema: resourceIdParamSchema,
});

registerRoute({
  method: "post",
  path: "/api/resource-hub/{id}/comments",
  tags,
  summary: "Add a comment (or reply, via parentCommentId)",
  security: [{ userAuth: [] }],
  schema: addCommentSchema,
  extraResponses: { 201: { description: "Comment created" } },
});

registerRoute({
  method: "delete",
  path: "/api/resource-hub/comments/{commentId}",
  tags,
  summary: "Delete the logged-in user's own comment",
  security: [{ userAuth: [] }],
  schema: commentIdParamSchema,
});

registerRoute({
  method: "get",
  path: "/api/resource-hub/{id}/rating",
  tags,
  summary: "Get a resource's average rating (and the caller's own rating, if logged in)",
  security: [],
  schema: resourceIdParamSchema,
});

registerRoute({
  method: "post",
  path: "/api/resource-hub/{id}/rating",
  tags,
  summary: "Rate a resource 1-5 (upserts the caller's existing rating)",
  security: [{ userAuth: [] }],
  schema: rateResourceSchema,
});

registerRoute({
  method: "post",
  path: "/api/resource-hub/{id}/bookmark",
  tags,
  summary: "Toggle a bookmark on a resource",
  security: [{ userAuth: [] }],
  schema: resourceIdParamSchema,
});
