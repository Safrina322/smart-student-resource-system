import { registerRoute } from "../registry.js";
import { notificationIdParamSchema } from "../../validation/notificationValidation.js";

const tags = ["Notifications"];

registerRoute({
  method: "get",
  path: "/api/notifications",
  tags,
  summary: "List the logged-in user's notifications",
  security: [{ userAuth: [] }],
});

registerRoute({
  method: "patch",
  path: "/api/notifications/{id}/read",
  tags,
  summary: "Mark one notification as read",
  security: [{ userAuth: [] }],
  schema: notificationIdParamSchema,
});

registerRoute({
  method: "patch",
  path: "/api/notifications/read-all",
  tags,
  summary: "Mark all of the logged-in user's notifications as read",
  security: [{ userAuth: [] }],
});
