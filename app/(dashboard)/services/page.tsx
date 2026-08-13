"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ServiceTable } from "@/components/services";
import {
  Button,
  ErrorState,
  FilterBar,
  LoadingState,
  PageHeader,
  Pagination,
  SelectFilter,
} from "@/components/ui";
import { useCustomers, useServices } from "@/hooks";
import { formatCustomerName, formatLabel } from "@/lib/format";
import { DEFAULT_PAGE_SIZE, paginate } from "@/lib/pagination";
import { SERVICE_STATUSES } from "@/lib/schemas";
import type { ServiceStatus } from "@/types/service";

export default function ServicesPage() {
  const {
    data: services,
    loading: servicesLoading,
    error: servicesError,
  } = useServices();
  const {
    data: customers,
    loading: customersLoading,
    error: customersError,
  } = useCustomers();

  const [status, setStatus] = useState<ServiceStatus | "">("");
  const [page, setPage] = useState(1);

  const [prevStatus, setPrevStatus] = useState(status);
  if (status !== prevStatus) {
    setPrevStatus(status);
    setPage(1);
  }

  const loading = servicesLoading || customersLoading;
  const error = servicesError ?? customersError;

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const customer of customers) {
      map.set(customer.id, formatCustomerName(customer));
    }
    return map;
  }, [customers]);

  const filteredServices = useMemo(
    () => (status ? services.filter((s) => s.status === status) : services),
    [services, status],
  );

  const { data: pageServices, pagination } = paginate(
    filteredServices,
    page,
    DEFAULT_PAGE_SIZE,
  );

  if (pagination.page !== page) {
    setPage(pagination.page);
  }

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Services"
        description="Track project and service work delivered to customers."
        actions={
          <Link href="/services/new">
            <Button variant="primary">New service</Button>
          </Link>
        }
      />

      <FilterBar>
        <div className="flex flex-wrap items-center gap-3">
          <SelectFilter
            id="service-status-filter"
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as ServiceStatus | "")}
            allLabel="All statuses"
            options={SERVICE_STATUSES.map((value) => ({
              value,
              label: formatLabel(value),
            }))}
          />
        </div>
      </FilterBar>

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading services…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="px-5 sm:px-6 lg:px-8">
            <ServiceTable
              services={pageServices}
              customerNameById={customerNameById}
            />
          </div>
          <div className="border-t border-border px-5 py-4 sm:px-6 lg:px-8">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
