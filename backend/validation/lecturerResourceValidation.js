import { z } from "zod";

const optionalInt = (max) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().int().min(1).max(max).optional()
  );

const resourcePayload = {
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().trim().max(2000).optional(),
  subject: z.string().trim().max(100).optional(),
  department: z.string().trim().max(100).optional(),
  semester: optionalInt(12),
  courseId: optionalInt(999999),
  resourceType: z.enum(["PDF", "Video", "Link", "Image", "ZIP", "Document"]),
  resourceLink: z.string().trim().url("Must be a valid URL").max(500),
  tags: z.string().trim().max(255).optional(),
};

export const uploadResourceSchema = z.object({
  body: z.object(resourcePayload),
});

export const updateResourceSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object(resourcePayload),
});

export const resourceIdParamSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
});

export const reviewResourceSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    comment: z.string().trim().max(1000).optional(),
  }),
});

export const reviewQueueQuerySchema = z.object({
  query: z.object({
    status: z.enum(["pending", "approved", "rejected", "flagged"]).optional(),
  }),
});
