"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationMeta } from "@/types/common";

type PaginationProps = {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
};

function pageRangeLabel(pagination: PaginationMeta): string {
  const { page, pageSize, totalItems } = pagination;
  if (totalItems === 0) return "Showing 0–0 of 0";

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  return `Showing ${from}–${to} of ${totalItems}`;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalItems, totalPages } = pagination;

  if (totalItems === 0) return null;

  const canPrev = page > 1;
  const canNext = page < totalPages;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-foreground-muted">{pageRangeLabel(pagination)}</p>

      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          aria-label="Previous page"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground-secondary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </button>

        {pages.map((pageNumber) => {
          const isActive = pageNumber === page;
          return (
            <button
              key={pageNumber}
              type="button"
              aria-label={`Page ${pageNumber}`}
              aria-current={isActive ? "page" : undefined}
              onClick={() => onPageChange(pageNumber)}
              className={
                isActive
                  ? "min-w-9 rounded-lg border border-brand bg-brand px-2.5 py-1.5 text-sm font-medium text-foreground-inverse"
                  : "min-w-9 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground-secondary hover:bg-surface-muted"
              }
            >
              {pageNumber}
            </button>
          );
        })}

        <button
          type="button"
          aria-label="Next page"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground-secondary hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
