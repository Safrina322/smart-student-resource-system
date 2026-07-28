import { z } from "zod";
import { MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from "../utils/pagination.js";

// Spread into any endpoint's `query` object:
// z.object({ query: z.object({ ...paginationParams, otherFilter: ... }) })
export const paginationParams = {
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional().default(DEFAULT_PAGE_SIZE),
};
