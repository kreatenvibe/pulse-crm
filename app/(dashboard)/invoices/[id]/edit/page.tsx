"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { InvoiceForm } from "@/components/invoices";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useInvoice } from "@/hooks";

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { data: invoice, loading, error } = useInvoice(id);

  return (
    <div className="flex w-full flex-col">
      <div className="border-b border-border px-5 py-5 sm:px-6 lg:px-8">
        <p className="text-sm text-foreground-muted">
          <Link
            href="/invoices"
            className="text-brand hover:text-brand-hover hover:underline"
          >
            Invoices
          </Link>
          <span className="mx-1.5 text-foreground-muted">/</span>
          <Link
            href={`/invoices/${id}`}
            className="text-brand hover:text-brand-hover hover:underline"
          >
            {invoice?.invoiceNumber ?? id}
          </Link>
          <span className="mx-1.5 text-foreground-muted">/</span>
          <span className="text-foreground-secondary">Edit</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Edit invoice
        </h1>
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
          <InvoiceForm
            mode="edit"
            invoice={invoice}
            onSuccess={() => router.push(`/invoices/${id}`)}
            onCancel={() => router.push(`/invoices/${id}`)}
          />
        </div>
      )}
    </div>
  );
}
