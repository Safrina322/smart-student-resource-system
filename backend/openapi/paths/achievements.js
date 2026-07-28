import { registerRoute } from "../registry.js";

const tags = ["Achievements"];

registerRoute({
  method: "get",
  path: "/api/achievements",
  tags,
  summary: "Get the logged-in student's badge progress",
  security: [{ userAuth: [] }],
});

registerRoute({
  method: "get",
  path: "/api/achievements/history",
  tags,
  summary: "Get the logged-in student's activity history",
  security: [{ userAuth: [] }],
});
