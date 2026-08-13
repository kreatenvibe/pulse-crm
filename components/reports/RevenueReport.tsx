import { Banknote, Wallet } from "lucide-react";
import { KpiCard } from "@/components/ui";
import type { InvoiceStatus } from "@/types/invoice";
import { formatMoney } from "@/lib/format";
import { BreakdownSection, breakdownFromRecord } from "./BreakdownSection";

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Collected revenue"
          value={formatMoney(paidAmountCents, currency, {
            maximumFractionDigits: 0,
          })}
          icon={<Banknote className="size-5 stroke-[1.5]" aria-hidden />}
          accent
          mono
        />
        <KpiCard
          label="Outstanding"
          value={formatMoney(outstandingAmountCents, currency, {
            maximumFractionDigits: 0,
          })}
          icon={<Wallet className="size-5 stroke-[1.5]" aria-hidden />}
          mono
        />
        <KpiCard
          label="Total billed"
          value={formatMoney(totalBilledCents, currency, {
            maximumFractionDigits: 0,
          })}
          mono
        />
      </div>

      <BreakdownSection
        title="Invoices by status"
        subtitle="Count of invoices per status"
        items={items}
        total={total}
      />
    </div>
  );
}
