import type { PaginatedResult } from "@/types/common";

export const DEFAULT_PAGE_SIZE = 10;

/**
 * Slice an in-memory list into a page and attach pagination metadata.
 * Compatible with future API/DB pagination (`page` + `pageSize` + meta).
 */
export function paginate<T>(
  items: readonly T[],
  page: number = 1,
  pageSize: number = DEFAULT_PAGE_SIZE,
): PaginatedResult<T> {
  const safePageSize = Math.max(1, Math.floor(pageSize) || DEFAULT_PAGE_SIZE);
  const totalItems = items.length;
  const totalPages =
    totalItems === 0 ? 0 : Math.ceil(totalItems / safePageSize);
  const safePage =
    totalPages === 0
      ? 1
      : Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (safePage - 1) * safePageSize;

  return {
    data: items.slice(start, start + safePageSize),
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      totalItems,
      totalPages,
    },
  };
}
