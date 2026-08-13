"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarDays, Clock, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import {
  buildAppointmentLookups,
  enrichAppointment,
} from "@/components/appointments";
import { KpiCard } from "@/components/dashboard";
import {
  Button,
  DetailField,
  DetailHeader,
  DetailMeta,
  DetailSection,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@/components/ui";
import {
  useAppointment,
  useCustomers,
  useLeads,
  useUsers,
} from "@/hooks";
import { formatDate, formatLabel, formatTimeRange } from "@/lib/format";
import { APPOINTMENT_STATUS_TONE } from "@/lib/status-tone";

function formatDuration(start: string, end: string): string {
  const minutes = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 60_000,
  );
  if (!Number.isFinite(minutes) || minutes <= 0) return "—";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

export default function AppointmentDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: appointment, loading, error } = useAppointment(id);
  const { data: leads } = useLeads();
  const { data: customers } = useCustomers();
  const { data: users } = useUsers();

  const lookups = useMemo(
    () => buildAppointmentLookups(leads, customers),
    [leads, customers],
  );
  const enriched = useMemo(
    () => (appointment ? enrichAppointment(appointment, lookups) : null),
    [appointment, lookups],
  );
  const assignedUserName =
    users.find((user) => user.id === appointment?.assignedTo)?.name ??
    appointment?.assignedTo ??
    "—";

  return (
    <div className="flex w-full flex-col">
      <DetailHeader
        backHref="/appointments"
        backLabel="Appointments"
        title={appointment?.title ?? id}
        badges={
          appointment ? (
            <StatusBadge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>
              {formatLabel(appointment.status)}
            </StatusBadge>
          ) : null
        }
        meta={
          appointment ? (
            <>
              <DetailMeta icon={<CalendarDays className="size-3.5" aria-hidden />}>
                {formatDate(appointment.start)}
              </DetailMeta>
              <DetailMeta icon={<Clock className="size-3.5" aria-hidden />}>
                {formatTimeRange(appointment.start, appointment.end)}
              </DetailMeta>
              <DetailMeta icon={<UserRound className="size-3.5" aria-hidden />}>
                {assignedUserName}
              </DetailMeta>
            </>
          ) : null
        }
        actions={
          appointment ? (
            <Link href={`/appointments/${id}/edit`}>
              <Button variant="primary">Edit appointment</Button>
            </Link>
          ) : null
        }
      />

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading appointment…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : !appointment ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <EmptyState message="Appointment not found." />
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label="Date"
              value={formatDate(appointment.start)}
              icon={<CalendarDays className="size-5 stroke-[1.5]" aria-hidden />}
            />
            <KpiCard
              label="Time"
              value={formatTimeRange(appointment.start, appointment.end)}
              icon={<Clock className="size-5 stroke-[1.5]" aria-hidden />}
            />
            <KpiCard
              label="Duration"
              value={formatDuration(appointment.start, appointment.end)}
              icon={<Clock className="size-5 stroke-[1.5]" aria-hidden />}
            />
          </div>

          <DetailSection title="Appointment details" subtitle="Ownership and links">
            <dl className="grid gap-4 px-5 py-6 sm:grid-cols-2 sm:px-6">
              <DetailField label="Assigned to">{assignedUserName}</DetailField>
              <DetailField label="Related">
                {enriched?.relatedHref ? (
                  <Link
                    href={enriched.relatedHref}
                    className="text-brand hover:text-brand-hover hover:underline"
                  >
                    {enriched.relatedType === "lead"
                      ? "Lead: "
                      : enriched.relatedType === "customer"
                        ? "Customer: "
                        : ""}
                    {enriched.relatedLabel}
                  </Link>
                ) : (
                  (enriched?.relatedLabel ?? "—")
                )}
              </DetailField>
            </dl>

            <div className="border-t border-border px-5 py-5 sm:px-6">
              <p className="text-xs font-medium text-foreground-muted">Notes</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
                {appointment.notes?.trim() ? appointment.notes : "—"}
              </p>
            </div>
          </DetailSection>
        </div>
      )}
    </div>
  );
}
