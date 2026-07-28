import { registerRoute } from "../registry.js";

registerRoute({
  method: "get",
  path: "/api/health",
  tags: ["Health"],
  summary: "Liveness/readiness check - pings the database, returns 503 if unreachable",
  security: [],
  extraResponses: {
    503: { description: "Database unreachable" },
  },
});
