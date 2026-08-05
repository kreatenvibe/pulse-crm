"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  LeadActions,
  LeadAppointments,
  LeadProfile,
  LeadTimeline,
} from "@/components/leads";
import { RelatedTasks } from "@/components/tasks";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useLeadDetails } from "@/hooks";

export default function LeadDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const {
    data,
    loading,
    error,
    actionError,
    actionLoading,
    changeStatus,
    addNote,
    scheduleAppointment,
    convertLead,
  } = useLeadDetails(id);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            <Link href="/leads" className="hover:underline">
              Leads
            </Link>
            <span className="mx-1">/</span>
            <span>{data?.lead.name ?? id}</span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {data?.lead.name ?? "Lead details"}
          </h1>
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading lead…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data ? (
        <EmptyState message="Lead not found." />
      ) : (
        <>
          <LeadProfile lead={data.lead} assignedUser={data.assignedUser} />

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col gap-6">
              <LeadTimeline
                activities={data.activities}
                notes={data.notes}
              />
              <div className="grid items-start gap-6 lg:grid-cols-2">
                <RelatedTasks
                  tasks={data.tasks}
                  emptyMessage="No tasks for this lead."
                />
                <LeadAppointments appointments={data.appointments} />
              </div>
            </div>

            <LeadActions
              currentStatus={data.lead.status}
              isConverted={data.lead.status === "converted"}
              actionLoading={actionLoading}
              actionError={actionError}
              onChangeStatus={changeStatus}
              onAddNote={addNote}
              onScheduleAppointment={scheduleAppointment}
              onConvertLead={convertLead}
            />
          </div>
        </>
      )}
    </div>
  );
}
