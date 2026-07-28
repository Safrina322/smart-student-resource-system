import { z } from "zod";
import { registerRoute } from "../registry.js";

const tags = ["Learning Progress"];

registerRoute({
  method: "post",
  path: "/api/user/track-access",
  tags,
  summary: "Record that the logged-in student accessed a course/lesson",
  security: [{ userAuth: [] }],
});

registerRoute({
  method: "get",
  path: "/api/user/continue-learning",
  tags,
  summary: "Get the student's most recently accessed course/lesson and recent activity",
  security: [{ userAuth: [] }],
});

registerRoute({
  method: "get",
  path: "/api/popular/popular-courses",
  tags,
  summary: "Most-accessed courses platform-wide (public)",
  security: [],
});

registerRoute({
  method: "get",
  path: "/api/popular/popular-lessons/{courseId}",
  tags,
  summary: "Most-accessed lessons within a course (public)",
  security: [],
  schema: z.object({ params: z.object({ courseId: z.coerce.number().int().positive() }) }),
});

registerRoute({
  method: "get",
  path: "/api/popular/trending",
  tags,
  summary: "Trending courses over a recent window (public)",
  security: [],
});
