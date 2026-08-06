"use client";

import { SearchInput, SelectFilter } from "@/components/ui";
import { formatLabel } from "@/lib/format";
import type { CustomerLifecycleStatus } from "@/types/customer";
import {
  CUSTOMER_LIFECYCLE_STATUSES,
  type SortOrder,
} from "./utils";

type CustomerFiltersProps = {
  search: string;
  lifecycleStatus: CustomerLifecycleStatus | "";
  sort: SortOrder;
  onSearchChange: (value: string) => void;
  onLifecycleStatusChange: (value: CustomerLifecycleStatus | "") => void;
  onSortChange: (value: SortOrder) => void;
};

export function CustomerFilters({
  search,
  lifecycleStatus,
  sort,
  onSearchChange,
  onLifecycleStatusChange,
  onSortChange,
}: CustomerFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-4">
      <SearchInput
        id="customer-search"
        label="Search customers"
        value={search}
        onChange={onSearchChange}
        placeholder="Search by name, company, or contact"
        className="w-full min-w-0 flex-1 lg:max-w-sm"
        hideLabel
      />

      <div className="flex flex-wrap items-end gap-3">
        <SelectFilter
          id="customer-lifecycle"
          label="Lifecycle"
          value={lifecycleStatus}
          allLabel="All statuses"
          options={CUSTOMER_LIFECYCLE_STATUSES.map((item) => ({
            value: item,
            label: formatLabel(item),
          }))}
          onChange={(value) =>
            onLifecycleStatusChange(value as CustomerLifecycleStatus | "")
          }
        />

        <SelectFilter
          id="customer-sort"
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
