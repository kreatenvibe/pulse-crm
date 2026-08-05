import {
  CalendarDays,
  FileWarning,
  UserRound,
  Users,
} from "lucide-react";
import type { DashboardSummaryDto } from "@/types/dashboard";
import { StatCard } from "./StatCard";

type DashboardSummaryProps = {
  summary: DashboardSummaryDto;
};

export function DashboardSummary({ summary }: DashboardSummaryProps) {
  const newLeads = summary.leads.byStatus.new ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total leads"
        value={summary.leads.total}
        hint={newLeads > 0 ? `${newLeads} new in pipeline` : "No new leads"}
        tone="brand"
        icon={<UserRound className="size-5" aria-hidden />}
      />
      <StatCard
        label="Active customers"
        value={summary.customers.active}
        hint={`${summary.customers.total} total customers`}
        tone="success"
        icon={<Users className="size-5" aria-hidden />}
      />
      <StatCard
        label="Upcoming appointments"
        value={summary.appointments.upcoming}
        hint={`${summary.appointments.total} total appointments`}
        tone="danger"
        icon={<CalendarDays className="size-5" aria-hidden />}
      />
      <StatCard
        label="Unpaid invoices"
        value={summary.invoices.unpaid}
        hint={
          summary.invoices.overdue > 0
            ? `${summary.invoices.overdue} overdue`
            : `${summary.invoices.total} total invoices`
        }
        tone="warning"
        icon={<FileWarning className="size-5" aria-hidden />}
      />
    </div>
  );
}
