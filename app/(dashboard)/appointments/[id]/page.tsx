"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  buildAppointmentLookups,
  enrichAppointment,
} from "@/components/appointments";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/ui";
import {
  useAppointment,
  useCustomers,
  useLeads,
  useUsers,
} from "@/hooks";
import { formatDateTime, formatLabel } from "@/lib/format";
import type { AppointmentStatus } from "@/types/appointment";

const STATUS_TONE: Record<AppointmentStatus, StatusBadgeTone> = {
  scheduled: "info",
  confirmed: "success",
  completed: "neutral",
  cancelled: "danger",
  no_show: "warning",
};

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
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-5 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm text-foreground-muted">
            <Link
              href="/appointments"
              className="text-brand hover:text-brand-hover hover:underline"
            >
              Appointments
            </Link>
            <span className="mx-1.5 text-foreground-muted">/</span>
            <span className="text-foreground-secondary">
              {appointment?.title ?? id}
            </span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {appointment?.title ?? "Appointment details"}
          </h1>
        </div>
        {appointment ? (
          <Link href={`/appointments/${id}/edit`}>
            <Button>Edit appointment</Button>
          </Link>
        ) : null}
      </div>

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
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <dl className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Status
              </dt>
              <dd className="mt-1">
                <StatusBadge tone={STATUS_TONE[appointment.status]}>
                  {formatLabel(appointment.status)}
                </StatusBadge>
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Assigned to
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {assignedUserName}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Start
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {formatDateTime(appointment.start)}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-foreground-muted">End</dt>
              <dd className="mt-1 text-sm text-foreground">
                {formatDateTime(appointment.end)}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Related
              </dt>
              <dd className="mt-1 text-sm text-foreground">
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
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-foreground-muted">
                Notes
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {appointment.notes?.trim() ? appointment.notes : "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
