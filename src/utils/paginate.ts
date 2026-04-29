// ============================================================
// Pagination Helper
// ============================================================

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const getPaginationParams = (
  pageStr?: string,
  limitStr?: string
): { skip: number; take: number; page: number; limit: number } => {
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(limitStr ?? "10", 10)));
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
});
