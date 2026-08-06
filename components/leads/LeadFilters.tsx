"use client";

import { SearchInput, SelectFilter } from "@/components/ui";
import type { LeadSource, LeadStatus } from "@/types/lead";
import { formatLabel } from "@/lib/format";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
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
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
      <SearchInput
        id="lead-search"
        label="Search leads"
        value={search}
        onChange={onSearchChange}
        placeholder="Search by name or company"
        className="w-full min-w-0 flex-1 lg:max-w-sm"
        hideLabel
      />

      <div className="flex flex-wrap items-end gap-3">
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
          label="Sort"
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
