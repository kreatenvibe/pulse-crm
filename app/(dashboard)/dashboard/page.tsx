"use client";

import { CalendarDays } from "lucide-react";
import {
  DashboardSummary,
  PipelineOverview,
  RecentActivity,
  UpcomingAppointments,
} from "@/components/dashboard";
import { ErrorState, LoadingState } from "@/components/ui";
import { useDashboard } from "@/hooks";
import { formatGreetingDate, greetingForHour } from "@/lib/format";

export default function DashboardPage() {
  const { data, loading, error } = useDashboard();
  const greeting = greetingForHour();
  const todayLabel = formatGreetingDate();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Overview of leads, customers, appointments, and recent activity.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-foreground-secondary shadow-card sm:self-auto">
          <CalendarDays className="size-4 text-brand" aria-hidden />
          <time dateTime={new Date().toISOString().slice(0, 10)}>
            {todayLabel}
          </time>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading dashboard…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <DashboardSummary summary={data} />

          <div className="grid gap-6 xl:grid-cols-2">
            <PipelineOverview
              byStatus={data.leads.byStatus}
              total={data.leads.total}
            />
            <UpcomingAppointments appointments={data.upcomingAppointments} />
          </div>

          <RecentActivity activities={data.recentActivities} />
        </>
      )}
    </div>
  );
}
