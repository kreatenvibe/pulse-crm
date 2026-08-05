import { StatusBadge, type StatusBadgeTone } from "@/components/ui";
import { formatDate, formatLabel } from "@/lib/format";
import type { InvoiceDto, InvoiceStatus } from "@/types/invoice";
import { formatMoney } from "./utils";

type CustomerInvoicesProps = {
  invoices: InvoiceDto[];
};

const STATUS_TONE: Record<InvoiceStatus, StatusBadgeTone> = {
  draft: "neutral",
  sent: "info",
  paid: "success",
  overdue: "danger",
  cancelled: "neutral",
};

export function CustomerInvoices({ invoices }: CustomerInvoicesProps) {
  const sorted = [...invoices].sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
  );

  return (
    <section className="rounded-xl border border-border bg-surface shadow-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Invoices</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">Billing history</p>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-foreground-muted">
          No invoices for this customer.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((invoice) => (
            <li key={invoice.id} className="px-5 py-3.5">
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
                    {formatMoney(invoice.amountCents, invoice.currency)}
                  </p>
                  <div className="mt-1.5 flex justify-end">
                    <StatusBadge tone={STATUS_TONE[invoice.status]}>
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
