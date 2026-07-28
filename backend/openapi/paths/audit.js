import { registerRoute } from "../registry.js";

registerRoute({
  method: "get",
  path: "/api/admin/audit/logs",
  tags: ["Audit Log"],
  summary: "List recent admin actions (course/lesson/user/request changes, etc.)",
  security: [{ adminAuth: [] }],
});
