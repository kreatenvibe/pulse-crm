"use client";

import { PipelineOverview } from "@/components/dashboard";
import {
  BreakdownSection,
  ConversionReport,
  RevenueReport,
  TaskCompletionReport,
  breakdownFromRecord,
} from "@/components/reports";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useReports } from "@/hooks";
import type { AppointmentStatus } from "@/types/appointment";
import type { LeadSource } from "@/types/lead";

const LEAD_SOURCE_ORDER: LeadSource[] = [
  "website",
  "whatsapp",
  "facebook",
  "instagram",
  "google",
  "referral",
  "walk_in",
  "phone",
];

const APPOINTMENT_STATUS_ORDER: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

export default function ReportsPage() {
  const { data, loading, error } = useReports();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Pipeline, activity, and revenue metrics derived from your CRM data.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Loading reports…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <ConversionReport
            total={data.leads.total}
            converted={data.leads.converted}
            conversionRate={data.leads.conversionRate}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <PipelineOverview
              byStatus={data.leads.byStatus}
              total={data.leads.total}
            />
            <BreakdownSection
              title="Leads by source"
              subtitle="Where new leads come from"
              items={breakdownFromRecord(
                data.leads.bySource,
                LEAD_SOURCE_ORDER,
              )}
              total={data.leads.total}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <BreakdownSection
              title="Appointments by status"
              subtitle="Meeting outcomes and scheduling"
              items={breakdownFromRecord(
                data.appointments.byStatus,
                APPOINTMENT_STATUS_ORDER,
              )}
              total={data.appointments.total}
            />
            <TaskCompletionReport
              total={data.tasks.total}
              open={data.tasks.open}
              completed={data.tasks.completed}
            />
          </div>

          <RevenueReport
            total={data.invoices.total}
            byStatus={data.invoices.byStatus}
            paidAmountCents={data.invoices.paidAmountCents}
            outstandingAmountCents={data.invoices.outstandingAmountCents}
            totalBilledCents={data.invoices.totalBilledCents}
          />
        </>
      )}
    </div>
  );
}
