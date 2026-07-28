import { z } from "zod";
import { registerRoute } from "../registry.js";
import { courseIdParamSchema } from "../../validation/courseValidation.js";

const tags = ["Courses"];

registerRoute({
  method: "get",
  path: "/api/courses",
  tags,
  summary: "List all active courses",
  security: [],
});

registerRoute({
  method: "get",
  path: "/api/courses/{id}",
  tags,
  summary: "Get a single course",
  security: [],
  schema: courseIdParamSchema,
});

registerRoute({
  method: "get",
  path: "/api/courses/{id}/lessons",
  tags,
  summary: "List a course's lessons",
  security: [],
  schema: courseIdParamSchema,
});

// The admin course/lesson routes take multipart/form-data (Cloudinary file
// uploads via multer) and predate this codebase's Zod validation convention
// - there's no schema to pull path-param types from, so they're declared
// inline here for documentation purposes only.
registerRoute({
  method: "post",
  path: "/api/admin/courses/add",
  tags,
  summary: "Create a course (multipart: course image + optional first lesson file)",
  security: [{ adminAuth: [] }],
});

registerRoute({
  method: "post",
  path: "/api/admin/courses/{courseId}/lessons",
  tags,
  summary: "Add a lesson to a course (multipart: lesson resource file)",
  security: [{ adminAuth: [] }],
  schema: z.object({ params: z.object({ courseId: z.coerce.number().int().positive() }) }),
});

registerRoute({
  method: "get",
  path: "/api/admin/courses/{courseId}/lessons",
  tags,
  summary: "List a course's lessons (admin)",
  security: [{ adminAuth: [] }],
  schema: z.object({ params: z.object({ courseId: z.coerce.number().int().positive() }) }),
});

registerRoute({
  method: "put",
  path: "/api/admin/courses/lessons/{lessonId}",
  tags,
  summary: "Update a lesson",
  security: [{ adminAuth: [] }],
  schema: z.object({ params: z.object({ lessonId: z.coerce.number().int().positive() }) }),
});

registerRoute({
  method: "delete",
  path: "/api/admin/courses/lessons/{lessonId}",
  tags,
  summary: "Delete a lesson",
  security: [{ adminAuth: [] }],
  schema: z.object({ params: z.object({ lessonId: z.coerce.number().int().positive() }) }),
});
