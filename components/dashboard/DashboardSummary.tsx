import {
  CalendarDays,
  FileWarning,
  Minus,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import type { DashboardSummaryDto } from "@/types/dashboard";
import { KpiCard } from "./KpiCard";

type DashboardSummaryProps = {
  summary: DashboardSummaryDto;
};

export function DashboardSummary({ summary }: DashboardSummaryProps) {
  const newLeads = summary.leads.byStatus.new ?? 0;

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <KpiCard
        label="Total leads"
        value={summary.leads.total}
        hint={newLeads > 0 ? `${newLeads} new in pipeline` : "No new leads"}
        hintIcon={<TrendingUp className="size-3.5" aria-hidden />}
        icon={<UserRound className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <KpiCard
        label="Active customers"
        value={summary.customers.active}
        hint={`${summary.customers.total} total customers`}
        hintIcon={<Minus className="size-3.5" aria-hidden />}
        icon={<Users className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <KpiCard
        label="Appointments"
        value={summary.appointments.upcoming}
        hint={`${summary.appointments.total} total appointments`}
        icon={<CalendarDays className="size-5 stroke-[1.5]" aria-hidden />}
        accent
      />
      <KpiCard
        label="Unpaid invoices"
        value={summary.invoices.unpaid}
        hint={
          summary.invoices.overdue > 0
            ? `${summary.invoices.overdue} overdue`
            : `${summary.invoices.total} total invoices`
        }
        hintIcon={
          summary.invoices.overdue > 0 ? (
            <FileWarning className="size-3.5" aria-hidden />
          ) : undefined
        }
        icon={<FileWarning className="size-5 stroke-[1.5]" aria-hidden />}
      />
    </div>
  );
}
