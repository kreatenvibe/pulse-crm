"use client";

import { useState } from "react";
import {
  CustomerFilters,
  CustomerTable,
  filterCustomers,
  type SortOrder,
} from "@/components/customers";
import {
  ErrorState,
  LoadingState,
  Pagination,
} from "@/components/ui";
import { useCustomers } from "@/hooks";
import { DEFAULT_PAGE_SIZE, paginate } from "@/lib/pagination";
import type { CustomerLifecycleStatus } from "@/types/customer";

export default function CustomersPage() {
  const { data: customers, loading, error } = useCustomers();

  const [search, setSearch] = useState("");
  const [lifecycleStatus, setLifecycleStatus] = useState<
    CustomerLifecycleStatus | ""
  >("");
  const [sort, setSort] = useState<SortOrder>("newest");
  const [page, setPage] = useState(1);

  const filterKey = `${search}\0${lifecycleStatus}\0${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const filteredCustomers = filterCustomers(customers, {
    search,
    lifecycleStatus,
    sort,
  });
  const { data: pageCustomers, pagination } = paginate(
    filteredCustomers,
    page,
    DEFAULT_PAGE_SIZE,
  );

  if (pagination.page !== page) {
    setPage(pagination.page);
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Search, filter, and review converted customers.
        </p>
      </div>

      <CustomerFilters
        search={search}
        lifecycleStatus={lifecycleStatus}
        sort={sort}
        onSearchChange={setSearch}
        onLifecycleStatusChange={setLifecycleStatus}
        onSortChange={setSort}
      />

      {loading ? (
        <LoadingState message="Loading customers…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="flex flex-col gap-4">
          <CustomerTable customers={pageCustomers} />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
