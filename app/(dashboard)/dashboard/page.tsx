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
    <div className="flex w-full flex-col">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Overview of leads, customers, appointments, and recent activity.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start text-sm text-foreground-secondary sm:self-auto">
          <CalendarDays className="size-4 text-foreground-muted stroke-[1.5]" aria-hidden />
          <time dateTime={new Date().toISOString().slice(0, 10)}>
            {todayLabel}
          </time>
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading dashboard…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : (
        <>
          <div className="border-b border-border px-5 sm:px-6 lg:px-8">
            <DashboardSummary summary={data} />
          </div>

          <div className="grid border-b border-border xl:grid-cols-2">
            <div className="border-b border-border px-5 py-6 sm:px-6 lg:px-8 xl:border-r xl:border-b-0">
              <PipelineOverview
                byStatus={data.leads.byStatus}
                total={data.leads.total}
              />
            </div>
            <div className="px-5 py-6 sm:px-6 lg:px-8">
              <UpcomingAppointments appointments={data.upcomingAppointments} />
            </div>
          </div>

          <div className="px-5 py-6 sm:px-6 lg:px-8">
            <RecentActivity activities={data.recentActivities} />
          </div>
        </>
      )}
    </div>
  );
}
