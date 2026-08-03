"use client";

import {
  DashboardSummary,
  PipelineOverview,
  RecentActivity,
  UpcomingAppointments,
} from "@/components/dashboard";
import { EmptyState, LoadingState } from "@/components/ui";
import { useDashboard } from "@/hooks";

export default function DashboardPage() {
  const { data, loading, error } = useDashboard();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Overview of leads, customers, appointments, and recent activity.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Loading dashboard…" />
      ) : error ? (
        <EmptyState message={error} />
      ) : (
        <>
          <DashboardSummary summary={data} />

          <div className="grid gap-6 lg:grid-cols-2">
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
