"use client";

import Link from "next/link";
import { Building2, Mail, Phone } from "lucide-react";
import { useParams } from "next/navigation";
import {
  LeadActions,
  LeadProfile,
  LeadSummary,
} from "@/components/leads";
import { AppointmentsPanel, Timeline } from "@/components/shared";
import { RelatedTasks } from "@/components/tasks";
import {
  Button,
  DetailHeader,
  DetailMeta,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@/components/ui";
import { useLeadDetails } from "@/hooks";
import { formatLabel } from "@/lib/format";
import { LEAD_PRIORITY_TONE, LEAD_STATUS_TONE } from "@/lib/status-tone";

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
      <DetailHeader
        backHref="/leads"
        backLabel="Leads"
        title={data?.lead.name ?? id}
        badges={
          data ? (
            <>
              <StatusBadge tone={LEAD_STATUS_TONE[data.lead.status]}>
                {formatLabel(data.lead.status)}
              </StatusBadge>
              <StatusBadge tone={LEAD_PRIORITY_TONE[data.lead.priority]}>
                {formatLabel(data.lead.priority)}
              </StatusBadge>
            </>
          ) : null
        }
        meta={
          data ? (
            <>
              {data.lead.company ? (
                <DetailMeta icon={<Building2 className="size-3.5" aria-hidden />}>
                  {data.lead.company}
                </DetailMeta>
              ) : null}
              <DetailMeta icon={<Phone className="size-3.5" aria-hidden />}>
                <span className="tabular-nums">{data.lead.phone}</span>
              </DetailMeta>
              {data.lead.email ? (
                <DetailMeta icon={<Mail className="size-3.5" aria-hidden />}>
                  {data.lead.email}
                </DetailMeta>
              ) : null}
            </>
          ) : null
        }
        actions={
          data ? (
            <Link href={`/leads/${id}/edit`}>
              <Button variant="primary">Edit lead</Button>
            </Link>
          ) : null
        }
      />

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
        <div className="flex flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
          <LeadSummary
            lead={data.lead}
            activities={data.activities}
            appointments={data.appointments}
            tasks={data.tasks}
          />

          <LeadProfile lead={data.lead} assignedUser={data.assignedUser} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col gap-6">
              <Timeline activities={data.activities} notes={data.notes} />

              <div className="grid gap-6 sm:grid-cols-2">
                <RelatedTasks
                  tasks={data.tasks}
                  emptyMessage="No tasks for this lead."
                />
                <AppointmentsPanel
                  appointments={data.appointments}
                  emptyMessage="No appointments for this lead."
                />
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
        </div>
      )}
    </div>
  );
}
