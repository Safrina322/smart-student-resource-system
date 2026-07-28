import { registerRoute } from "../registry.js";
import {
  listUsersQuerySchema,
  changeRoleSchema,
  changeStatusSchema,
} from "../../validation/userManagementValidation.js";

const tags = ["User Management"];

registerRoute({
  method: "get",
  path: "/api/admin/users",
  tags,
  summary: "List users, optionally filtered by role/status/search",
  security: [{ adminAuth: [] }],
  schema: listUsersQuerySchema,
});

registerRoute({
  method: "patch",
  path: "/api/admin/users/{id}/role",
  tags,
  summary: "Change a user's role",
  security: [{ adminAuth: [] }],
  schema: changeRoleSchema,
});

registerRoute({
  method: "patch",
  path: "/api/admin/users/{id}/status",
  tags,
  summary: "Activate or deactivate a user",
  security: [{ adminAuth: [] }],
  schema: changeStatusSchema,
});
