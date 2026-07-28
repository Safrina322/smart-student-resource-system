import { z } from "zod";
import { registerRoute } from "../registry.js";

const tags = ["Analytics"];

registerRoute({
  method: "post",
  path: "/api/analytics/events",
  tags,
  summary: "Track a client-side analytics event (page view, resource view, etc.)",
  security: [{ userAuth: [] }],
});

registerRoute({
  method: "get",
  path: "/api/admin/analytics/summary",
  tags,
  summary: "Platform-wide usage summary",
  security: [{ adminAuth: [] }],
});

registerRoute({
  method: "get",
  path: "/api/admin/analytics/trends",
  tags,
  summary: "Usage trends over time (for the activity trend chart)",
  security: [{ adminAuth: [] }],
});

registerRoute({
  method: "get",
  path: "/api/admin/analytics/report",
  tags,
  summary: "Generate and download an on-demand analytics report (CSV)",
  security: [{ adminAuth: [] }],
});

registerRoute({
  method: "get",
  path: "/api/admin/analytics/report/history",
  tags,
  summary: "List previously generated reports",
  security: [{ adminAuth: [] }],
});

registerRoute({
  method: "get",
  path: "/api/admin/analytics/report/schedules",
  tags,
  summary: "Get the logged-in admin's scheduled report configuration",
  security: [{ adminAuth: [] }],
});

registerRoute({
  method: "post",
  path: "/api/admin/analytics/report/schedules",
  tags,
  summary: "Create or update the logged-in admin's scheduled report",
  security: [{ adminAuth: [] }],
});

registerRoute({
  method: "delete",
  path: "/api/admin/analytics/report/schedules/{id}",
  tags,
  summary: "Delete a scheduled report",
  security: [{ adminAuth: [] }],
  schema: z.object({ params: z.object({ id: z.coerce.number().int().positive() }) }),
});
