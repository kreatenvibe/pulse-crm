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
import { Button, EmptyState, ErrorState, LoadingState } from "@/components/ui";
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
    <div className="flex w-full flex-col">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-5 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm text-foreground-muted">
            <Link
              href="/leads"
              className="text-brand hover:text-brand-hover hover:underline"
            >
              Leads
            </Link>
            <span className="mx-1.5 text-foreground-muted">/</span>
            <span className="text-foreground-secondary">
              {data?.lead.name ?? id}
            </span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {data?.lead.name ?? "Lead details"}
          </h1>
        </div>
        {data ? (
          <Link href={`/leads/${id}/edit`}>
            <Button>Edit lead</Button>
          </Link>
        ) : null}
      </div>

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading lead…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : !data ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <EmptyState message="Lead not found." />
        </div>
      ) : (
        <>
          <LeadProfile lead={data.lead} assignedUser={data.assignedUser} />

          <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 lg:border-r lg:border-border">
              <LeadTimeline
                activities={data.activities}
                notes={data.notes}
              />

              <div className="grid sm:grid-cols-2">
                <div className="border-b border-border sm:border-r">
                  <RelatedTasks
                    tasks={data.tasks}
                    emptyMessage="No tasks for this lead."
                  />
                </div>
                <div className="border-b border-border">
                  <LeadAppointments appointments={data.appointments} />
                </div>
              </div>
            </div>

            <div className="border-b border-border lg:border-b-0">
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
          </div>
        </>
      )}
    </div>
  );
}
