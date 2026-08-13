"use client";

import Link from "next/link";
import {
  DataTable,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import { formatDate, formatLabel, formatMoney } from "@/lib/format";
import { INVOICE_STATUS_TONE } from "@/lib/status-tone";
import type { InvoiceDto } from "@/types/invoice";

type InvoiceTableProps = {
  invoices: InvoiceDto[];
  /** Resolved customer labels by id, for the Customer column. */
  customerNameById: Map<string, string>;
  emptyMessage?: string;
};

export function InvoiceTable({
  invoices,
  customerNameById,
  emptyMessage = "No invoices found.",
}: InvoiceTableProps) {
  if (invoices.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <DataTable
      data={invoices}
      getRowId={(invoice) => invoice.id}
      columns={[
        {
          id: "invoiceNumber",
          header: "Invoice",
          cell: (invoice) => (
            <Link
              href={`/invoices/${invoice.id}`}
              className="block max-w-64 truncate font-medium text-brand hover:text-brand-hover hover:underline"
              title={invoice.invoiceNumber}
            >
              {invoice.invoiceNumber}
            </Link>
          ),
        },
        {
          id: "customer",
          header: "Customer",
          muted: true,
          cell: (invoice) => (
            <Link
              href={`/customers/${invoice.customerId}`}
              className="text-brand hover:text-brand-hover hover:underline"
            >
              {customerNameById.get(invoice.customerId) ?? invoice.customerId}
            </Link>
          ),
        },
        {
          id: "amount",
          header: "Amount",
          cell: (invoice) => (
            <span className="whitespace-nowrap font-medium">
              {formatMoney(invoice.amountCents, invoice.currency)}
            </span>
          ),
        },
        {
          id: "dueDate",
          header: "Due",
          muted: true,
          cell: (invoice) => (
            <span className="whitespace-nowrap">
              {formatDate(invoice.dueDate)}
            </span>
          ),
        },
        {
          id: "status",
          header: "Status",
          cell: (invoice) => (
            <StatusBadge tone={INVOICE_STATUS_TONE[invoice.status]}>
              {formatLabel(invoice.status)}
            </StatusBadge>
          ),
        },
      ]}
    />
  );
}
