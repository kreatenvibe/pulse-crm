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

  const upcoming = data.appointments.upcoming;
  const newLeads = data.leads.byStatus.new ?? 0;

  return (
    <div className="flex w-full flex-col">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-6 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {greeting}
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            {loading || error
              ? "Overview of leads, customers, appointments, and recent activity."
              : `You have ${upcoming} upcoming ${
                  upcoming === 1 ? "appointment" : "appointments"
                } and ${newLeads} new ${
                  newLeads === 1 ? "lead" : "leads"
                } to review.`}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 self-start text-sm text-foreground-secondary sm:self-auto">
          <CalendarDays className="size-4 text-foreground-muted stroke-[1.5]" aria-hidden />
          <time dateTime={new Date().toISOString().slice(0, 10)}>
            {todayLabel}
          </time>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <LoadingState message="Loading dashboard…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="flex flex-col gap-6">
            <DashboardSummary summary={data} />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="flex flex-col gap-6 xl:col-span-2">
                <PipelineOverview
                  byStatus={data.leads.byStatus}
                  total={data.leads.total}
                />
                <UpcomingAppointments
                  appointments={data.upcomingAppointments}
                />
              </div>
              <div className="xl:col-span-1">
                <RecentActivity activities={data.recentActivities} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
