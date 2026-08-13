import { StatusBadge } from "@/components/ui";
import { formatDate, formatLabel, formatMoney } from "@/lib/format";
import { INVOICE_STATUS_TONE } from "@/lib/status-tone";
import type { InvoiceDto } from "@/types/invoice";

type CustomerInvoicesProps = {
  invoices: InvoiceDto[];
};

export function CustomerInvoices({ invoices }: CustomerInvoicesProps) {
  const sorted = [...invoices].sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
  );

  return (
    <section className="h-full border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-foreground">Invoices</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">Billing history</p>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-foreground-muted sm:px-6">
          No invoices for this customer.
        </div>
      ) : (
        <ul>
          {sorted.map((invoice) => (
            <li
              key={invoice.id}
              className="border-b border-border px-5 py-3.5 last:border-b-0 sm:px-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    Issued {formatDate(invoice.issuedAt)} · Due{" "}
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium tabular-nums text-foreground">
                    {formatMoney(invoice.amountCents, invoice.currency, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <div className="mt-1.5 flex justify-end">
                    <StatusBadge tone={INVOICE_STATUS_TONE[invoice.status]}>
                      {formatLabel(invoice.status)}
                    </StatusBadge>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
