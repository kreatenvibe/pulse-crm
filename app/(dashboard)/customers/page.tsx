"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CustomerFilters,
  CustomerTable,
  filterCustomers,
  type SortOrder,
} from "@/components/customers";
import {
  Button,
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
    <div className="flex w-full flex-col">
      <div className="border-b border-border px-5 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Customers
            </h1>
            <p className="mt-1 text-sm text-foreground-muted">
              Search, filter, and review converted customers.
            </p>
          </div>
          <Link href="/customers/new">
            <Button variant="primary">New customer</Button>
          </Link>
        </div>
      </div>

      <div className="border-b border-border px-5 py-4 sm:px-6 lg:px-8">
        <CustomerFilters
          search={search}
          lifecycleStatus={lifecycleStatus}
          sort={sort}
          onSearchChange={setSearch}
          onLifecycleStatusChange={setLifecycleStatus}
          onSortChange={setSort}
        />
      </div>

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading customers…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="px-5 sm:px-6 lg:px-8">
            <CustomerTable customers={pageCustomers} />
          </div>
          <div className="border-t border-border px-5 py-4 sm:px-6 lg:px-8">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
