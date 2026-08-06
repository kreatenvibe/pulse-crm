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
    <div className="grid gap-6 py-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0 xl:divide-x xl:divide-border">
      <StatCard
        className="xl:pr-8"
        label="Total leads"
        value={summary.leads.total}
        hint={newLeads > 0 ? `${newLeads} new in pipeline` : "No new leads"}
        tone="brand"
        icon={<UserRound className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <StatCard
        className="xl:px-8"
        label="Active customers"
        value={summary.customers.active}
        hint={`${summary.customers.total} total customers`}
        tone="success"
        icon={<Users className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <StatCard
        className="xl:px-8"
        label="Upcoming appointments"
        value={summary.appointments.upcoming}
        hint={`${summary.appointments.total} total appointments`}
        tone="danger"
        icon={<CalendarDays className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <StatCard
        className="xl:pl-8"
        label="Unpaid invoices"
        value={summary.invoices.unpaid}
        hint={
          summary.invoices.overdue > 0
            ? `${summary.invoices.overdue} overdue`
            : `${summary.invoices.total} total invoices`
        }
        tone="warning"
        icon={<FileWarning className="size-5 stroke-[1.5]" aria-hidden />}
      />
    </div>
  );
}
