"use client";

import {
  SearchInput,
  SelectFilter,
} from "@/components/ui";
import type { LeadSource, LeadStatus } from "@/types/lead";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  formatLabel,
  type SortOrder,
} from "./utils";

type LeadFiltersProps = {
  search: string;
  status: LeadStatus | "";
  source: LeadSource | "";
  sort: SortOrder;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: LeadStatus | "") => void;
  onSourceChange: (value: LeadSource | "") => void;
  onSortChange: (value: SortOrder) => void;
};

export function LeadFilters({
  search,
  status,
  source,
  sort,
  onSearchChange,
  onStatusChange,
  onSourceChange,
  onSortChange,
}: LeadFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <SearchInput
        id="lead-search"
        value={search}
        onChange={onSearchChange}
        placeholder="Search by name or company"
      />

      <div className="flex flex-wrap gap-4">
        <SelectFilter
          id="lead-status"
          label="Status"
          value={status}
          allLabel="All statuses"
          options={LEAD_STATUSES.map((item) => ({
            value: item,
            label: formatLabel(item),
          }))}
          onChange={(value) => onStatusChange(value as LeadStatus | "")}
        />

        <SelectFilter
          id="lead-source"
          label="Source"
          value={source}
          allLabel="All sources"
          options={LEAD_SOURCES.map((item) => ({
            value: item,
            label: formatLabel(item),
          }))}
          onChange={(value) => onSourceChange(value as LeadSource | "")}
        />

        <SelectFilter
          id="lead-sort"
          label="Sort by created"
          value={sort}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
          ]}
          onChange={(value) => onSortChange(value as SortOrder)}
        />
      </div>
    </div>
  );
}
