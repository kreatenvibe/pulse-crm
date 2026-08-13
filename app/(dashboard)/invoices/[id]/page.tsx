"use client";

import Link from "next/link";
import { CalendarClock, UserRound, Wallet } from "lucide-react";
import { useParams } from "next/navigation";
import { KpiCard } from "@/components/dashboard";
import {
  Button,
  DetailField,
  DetailHeader,
  DetailMeta,
  DetailSection,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@/components/ui";
import { useCustomers, useInvoice, useServices } from "@/hooks";
import { formatDate, formatLabel, formatMoney } from "@/lib/format";
import { INVOICE_STATUS_TONE } from "@/lib/status-tone";

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

  const isOverdue =
    !!invoice &&
    (invoice.status === "overdue" ||
      (invoice.status !== "paid" &&
        invoice.status !== "cancelled" &&
        new Date(invoice.dueDate).getTime() < Date.now()));

  return (
    <div className="flex w-full flex-col">
      <DetailHeader
        backHref="/invoices"
        backLabel="Invoices"
        title={invoice?.invoiceNumber ?? id}
        badges={
          invoice ? (
            <StatusBadge tone={INVOICE_STATUS_TONE[invoice.status]}>
              {formatLabel(invoice.status)}
            </StatusBadge>
          ) : null
        }
        meta={
          invoice ? (
            <>
              <DetailMeta icon={<UserRound className="size-3.5" aria-hidden />}>
                <Link
                  href={`/customers/${invoice.customerId}`}
                  className="font-medium text-brand hover:text-brand-hover hover:underline"
                >
                  {customerLabel}
                </Link>
              </DetailMeta>
              <DetailMeta icon={<CalendarClock className="size-3.5" aria-hidden />}>
                <span className={isOverdue ? "text-danger" : undefined}>
                  Due {formatDate(invoice.dueDate)}
                </span>
              </DetailMeta>
            </>
          ) : null
        }
        actions={
          invoice ? (
            <Link href={`/invoices/${id}/edit`}>
              <Button variant="primary">Edit invoice</Button>
            </Link>
          ) : null
        }
      />

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
        <div className="flex flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label="Amount"
              value={formatMoney(invoice.amountCents, invoice.currency)}
              icon={<Wallet className="size-5 stroke-[1.5]" aria-hidden />}
              accent
              mono
            />
            <KpiCard label="Issued" value={formatDate(invoice.issuedAt)} />
            <KpiCard
              label="Due"
              value={formatDate(invoice.dueDate)}
              hint={isOverdue ? "Overdue" : undefined}
              hintIcon={
                isOverdue ? (
                  <CalendarClock className="size-3.5" aria-hidden />
                ) : undefined
              }
              icon={<CalendarClock className="size-5 stroke-[1.5]" aria-hidden />}
            />
          </div>

          <DetailSection title="Invoice details" subtitle="Billing and links">
            <dl className="grid gap-4 px-5 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
              <DetailField label="Customer">
                <Link
                  href={`/customers/${invoice.customerId}`}
                  className="text-brand hover:text-brand-hover hover:underline"
                >
                  {customerLabel}
                </Link>
              </DetailField>
              <DetailField label="Service">
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
              </DetailField>
              <DetailField label="Amount">
                <span className="font-medium tabular-nums">
                  {formatMoney(invoice.amountCents, invoice.currency)}
                </span>
              </DetailField>
              <DetailField label="Issued date">
                {formatDate(invoice.issuedAt)}
              </DetailField>
              <DetailField label="Due date">
                <span className={isOverdue ? "text-danger" : undefined}>
                  {formatDate(invoice.dueDate)}
                </span>
              </DetailField>
            </dl>
          </DetailSection>
        </div>
      )}
    </div>
  );
}
