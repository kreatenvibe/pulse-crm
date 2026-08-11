"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ServiceTable } from "@/components/services";
import {
  Button,
  ErrorState,
  LoadingState,
  Pagination,
  SelectFilter,
} from "@/components/ui";
import { useCustomers, useServices } from "@/hooks";
import { formatLabel } from "@/lib/format";
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
      map.set(
        customer.id,
        customer.businessName
          ? `${customer.businessName} — ${customer.primaryContact}`
          : customer.primaryContact,
      );
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
    <div className="flex w-full flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Services
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Track project and service work delivered to customers.
          </p>
        </div>
        <Link href="/services/new">
          <Button variant="primary">New service</Button>
        </Link>
      </div>

      {loading ? (
        <LoadingState message="Loading services…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
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

          <div className="flex flex-col gap-4">
            <ServiceTable
              services={pageServices}
              customerNameById={customerNameById}
            />
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        </>
      )}
    </div>
  );
}
