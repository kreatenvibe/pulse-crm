"use client";

import { useState } from "react";
import {
  LeadFilters,
  LeadTable,
  filterLeads,
  type SortOrder,
} from "@/components/leads";
import {
  ErrorState,
  LoadingState,
  Pagination,
} from "@/components/ui";
import { useLeads } from "@/hooks";
import { DEFAULT_PAGE_SIZE, paginate } from "@/lib/pagination";
import type { LeadSource, LeadStatus } from "@/types/lead";

export default function LeadsPage() {
  const { data: leads, loading, error } = useLeads();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [source, setSource] = useState<LeadSource | "">("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [page, setPage] = useState(1);

  const filterKey = `${search}\0${status}\0${source}\0${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const filteredLeads = filterLeads(leads, { search, status, source, sort });
  const { data: pageLeads, pagination } = paginate(
    filteredLeads,
    page,
    DEFAULT_PAGE_SIZE,
  );

  if (pagination.page !== page) {
    setPage(pagination.page);
  }

  const totalCount = loading ? null : filteredLeads.length;

  return (
    <div className="flex w-full flex-col">
      <div className="border-b border-border px-5 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Leads
          </h1>
          {totalCount !== null ? (
            <span className="text-lg font-medium text-foreground-muted tabular-nums">
              {totalCount}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-foreground-muted">
          Search, filter, and review incoming leads.
        </p>
      </div>

      <div className="border-b border-border px-5 py-4 sm:px-6 lg:px-8">
        <LeadFilters
          search={search}
          status={status}
          source={source}
          sort={sort}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onSourceChange={setSource}
          onSortChange={setSort}
        />
      </div>

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading leads…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="px-5 sm:px-6 lg:px-8">
            <LeadTable leads={pageLeads} />
          </div>
          <div className="border-t border-border px-5 py-4 sm:px-6 lg:px-8">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
