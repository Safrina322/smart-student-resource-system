import { z } from "zod";
import { paginationParams } from "./paginationValidation.js";

export const listResourcesQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().max(200).optional(),
    subject: z.string().trim().max(100).optional(),
    department: z.string().trim().max(100).optional(),
    ...paginationParams,
  }),
});

export const resourceIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

export const addCommentSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    commentText: z.string().trim().min(1, "Comment cannot be empty").max(2000),
    parentCommentId: z.coerce.number().int().positive().optional(),
  }),
});

export const commentIdParamSchema = z.object({
  params: z.object({
    commentId: z.coerce.number().int().positive(),
  }),
});

export const rateResourceSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    rating: z.coerce.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  }),
});
