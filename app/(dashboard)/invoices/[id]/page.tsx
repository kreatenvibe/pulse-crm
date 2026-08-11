"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/ui";
import { useCustomers, useInvoice, useServices } from "@/hooks";
import { formatDate, formatLabel, formatMoney } from "@/lib/format";
import type { InvoiceStatus } from "@/types/invoice";

const STATUS_TONE: Record<InvoiceStatus, StatusBadgeTone> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  overdue: "danger",
  cancelled: "neutral",
};

export default function InvoiceDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: invoice, loading, error } = useInvoice(id);
  const { data: customers } = useCustomers();
  const { data: services } = useServices();

  const customer = customers.find((c) => c.id === invoice?.customerId);
  const customerLabel = customer
    ? customer.businessName
      ? `${customer.businessName} — ${customer.primaryContact}`
      : customer.primaryContact
    : (invoice?.customerId ?? "—");

  const service = services.find((s) => s.id === invoice?.serviceId);

  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-5 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm text-foreground-muted">
            <Link
              href="/invoices"
              className="text-brand hover:text-brand-hover hover:underline"
            >
              Invoices
            </Link>
            <span className="mx-1.5 text-foreground-muted">/</span>
            <span className="text-foreground-secondary">
              {invoice?.invoiceNumber ?? id}
            </span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {invoice?.invoiceNumber ?? "Invoice details"}
          </h1>
        </div>
        {invoice ? (
          <Link href={`/invoices/${id}/edit`}>
            <Button>Edit invoice</Button>
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading invoice…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : !invoice ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <EmptyState message="Invoice not found." />
        </div>
      ) : (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <dl className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Status
              </dt>
              <dd className="mt-1">
                <StatusBadge tone={STATUS_TONE[invoice.status]}>
                  {formatLabel(invoice.status)}
                </StatusBadge>
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Amount
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {formatMoney(invoice.amountCents, invoice.currency)}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Customer
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                <Link
                  href={`/customers/${invoice.customerId}`}
                  className="text-brand hover:text-brand-hover hover:underline"
                >
                  {customerLabel}
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Service
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {invoice.serviceId ? (
                  <Link
                    href={`/services/${invoice.serviceId}`}
                    className="text-brand hover:text-brand-hover hover:underline"
                  >
                    {service?.title ?? invoice.serviceId}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Issued date
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {formatDate(invoice.issuedAt)}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Due date
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {formatDate(invoice.dueDate)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
