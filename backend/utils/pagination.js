export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Shared response envelope for every paginated list endpoint, so a frontend
// consumer only has to learn this shape once.
export const buildPaginationMeta = (page, pageSize, total) => ({
  page,
  pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});
