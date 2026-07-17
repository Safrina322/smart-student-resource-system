import { z } from "zod";

export const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().min(1, "Search query is required").max(200),
  }),
});

export const popularSearchQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(20).optional(),
  }),
});
