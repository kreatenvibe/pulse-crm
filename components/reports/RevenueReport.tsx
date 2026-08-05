import { StatCard } from "@/components/dashboard/StatCard";
import type { InvoiceStatus } from "@/types/invoice";
import { BreakdownSection, breakdownFromRecord } from "./BreakdownSection";
import { formatMoney } from "./utils";

const INVOICE_STATUS_ORDER: InvoiceStatus[] = [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
];

type RevenueReportProps = {
  total: number;
  byStatus: Record<InvoiceStatus, number>;
  paidAmountCents: number;
  outstandingAmountCents: number;
  totalBilledCents: number;
  currency?: string;
};

export function RevenueReport({
  total,
  byStatus,
  paidAmountCents,
  outstandingAmountCents,
  totalBilledCents,
  currency = "INR",
}: RevenueReportProps) {
  const items = breakdownFromRecord(byStatus, INVOICE_STATUS_ORDER);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded border border-zinc-200">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h2 className="text-sm font-semibold">Revenue summary</h2>
          <p className="text-xs text-zinc-500">Invoice totals from seed data</p>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-3">
          <StatCard
            label="Collected revenue"
            value={formatMoney(paidAmountCents, currency)}
          />
          <StatCard
            label="Outstanding"
            value={formatMoney(outstandingAmountCents, currency)}
          />
          <StatCard
            label="Total billed"
            value={formatMoney(totalBilledCents, currency)}
          />
        </div>
      </section>

      <BreakdownSection
        title="Invoices by status"
        subtitle="Count of invoices per status"
        items={items}
        total={total}
      />
    </div>
  );
}
