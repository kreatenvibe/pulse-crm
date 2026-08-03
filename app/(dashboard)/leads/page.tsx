"use client";

import { useState } from "react";
import {
  LeadFilters,
  LeadTable,
  filterLeads,
  type SortOrder,
} from "@/components/leads";
import { EmptyState, LoadingState } from "@/components/ui";
import { useLeads } from "@/hooks";
import type { LeadSource, LeadStatus } from "@/types/lead";

export default function LeadsPage() {
  const { data: leads, loading, error } = useLeads();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [source, setSource] = useState<LeadSource | "">("");
  const [sort, setSort] = useState<SortOrder>("newest");

  const filteredLeads = filterLeads(leads, { search, status, source, sort });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="mt-1 text-sm text-zinc-500">
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
        <EmptyState message={error} />
      ) : (
        <LeadTable leads={filteredLeads} />
      )}
    </div>
  );
}
