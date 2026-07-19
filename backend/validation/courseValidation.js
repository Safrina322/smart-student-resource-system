import { z } from "zod";

export const courseIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});
