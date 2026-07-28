import { z } from "zod";
import { paginationParams } from "./paginationValidation.js";

export const courseListQuerySchema = z.object({
  query: z.object({ ...paginationParams }),
});

export const courseIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
