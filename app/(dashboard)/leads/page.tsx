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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Leads
        </h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Search, filter, and review incoming leads.
        </p>
      </div>

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

      {loading ? (
        <LoadingState message="Loading leads…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="flex flex-col gap-4">
          <LeadTable leads={pageLeads} />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
