import { z } from "zod";
import { paginationParams } from "./paginationValidation.js";

export const listRequestsQuerySchema = z.object({
  query: z.object({ ...paginationParams }),
});
