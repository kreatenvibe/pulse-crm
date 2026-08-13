"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { InvoiceTable } from "@/components/invoices";
import {
  Button,
  ErrorState,
  FilterBar,
  LoadingState,
  PageHeader,
  Pagination,
  SelectFilter,
} from "@/components/ui";
import { useCustomers, useInvoices } from "@/hooks";
import { formatCustomerName, formatLabel } from "@/lib/format";
import { DEFAULT_PAGE_SIZE, paginate } from "@/lib/pagination";
import { INVOICE_STATUSES } from "@/lib/schemas";
import type { InvoiceStatus } from "@/types/invoice";

export default function InvoicesPage() {
  const {
    data: invoices,
    loading: invoicesLoading,
    error: invoicesError,
  } = useInvoices();
  const {
    data: customers,
    loading: customersLoading,
    error: customersError,
  } = useCustomers();

  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [page, setPage] = useState(1);

  const [prevStatus, setPrevStatus] = useState(status);
  if (status !== prevStatus) {
    setPrevStatus(status);
    setPage(1);
  }

  const loading = invoicesLoading || customersLoading;
  const error = invoicesError ?? customersError;

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const customer of customers) {
      map.set(customer.id, formatCustomerName(customer));
    }
    return map;
  }, [customers]);

  const filteredInvoices = useMemo(
    () => (status ? invoices.filter((i) => i.status === status) : invoices),
    [invoices, status],
  );

  const { data: pageInvoices, pagination } = paginate(
    filteredInvoices,
    page,
    DEFAULT_PAGE_SIZE,
  );

  if (pagination.page !== page) {
    setPage(pagination.page);
  }

  return (
    <div className="flex w-full flex-col">
      <PageHeader
        title="Invoices"
        description="Track amounts billed to customers and their payment status."
        actions={
          <Link href="/invoices/new">
            <Button variant="primary">New invoice</Button>
          </Link>
        }
      />

      <FilterBar>
        <div className="flex flex-wrap items-center gap-3">
          <SelectFilter
            id="invoice-status-filter"
            label="Status"
            value={status}
            onChange={(value) => setStatus(value as InvoiceStatus | "")}
            allLabel="All statuses"
            options={INVOICE_STATUSES.map((value) => ({
              value,
              label: formatLabel(value),
            }))}
          />
        </div>
      </FilterBar>

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading invoices…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="px-5 sm:px-6 lg:px-8">
            <InvoiceTable
              invoices={pageInvoices}
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
