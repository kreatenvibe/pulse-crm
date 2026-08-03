import type { DashboardSummaryDto } from "@/types/dashboard";
import { StatCard } from "./StatCard";

type DashboardSummaryProps = {
  summary: DashboardSummaryDto;
};

export function DashboardSummary({ summary }: DashboardSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total leads" value={summary.leads.total} />
      <StatCard
        label="Total customers"
        value={summary.customers.total}
        hint={`${summary.customers.active} active`}
      />
      <StatCard
        label="Upcoming appointments"
        value={summary.appointments.upcoming}
      />
      <StatCard
        label="Open tasks"
        value={summary.tasks.open}
        hint={
          summary.tasks.overdue > 0
            ? `${summary.tasks.overdue} overdue`
            : undefined
        }
      />
    </div>
  );
}
