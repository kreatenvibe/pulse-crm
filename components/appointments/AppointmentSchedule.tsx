"use client";

import Link from "next/link";
import {
  DataTable,
  EmptyState,
  StatusBadge,
  type DataTableColumn,
} from "@/components/ui";
import { formatDate, formatLabel, formatTimeRange } from "@/lib/format";
import { APPOINTMENT_STATUS_TONE } from "@/lib/status-tone";
import type { EnrichedAppointment } from "./utils";

type AppointmentScheduleProps = {
  appointments: EnrichedAppointment[];
  emptyMessage?: string;
};

const COLUMNS: DataTableColumn<EnrichedAppointment>[] = [
  {
    id: "when",
    header: "Date & time",
    cell: (appointment) => (
      <div className="whitespace-nowrap">
        <span className="font-medium text-foreground">
          {formatDate(appointment.start)}
        </span>
        <span className="mt-0.5 block text-xs tabular-nums text-foreground-secondary">
          {formatTimeRange(appointment.start, appointment.end)}
        </span>
      </div>
    ),
  },
  {
    id: "title",
    header: "Appointment",
    cell: (appointment) => (
      <Link
        href={`/appointments/${appointment.id}`}
        className="font-medium text-brand hover:text-brand-hover hover:underline"
      >
        {appointment.title}
      </Link>
    ),
  },
  {
    id: "related",
    header: "Related",
    muted: true,
    cell: (appointment) =>
      appointment.relatedHref ? (
        <Link
          href={appointment.relatedHref}
          className="text-brand hover:text-brand-hover hover:underline"
        >
          {appointment.relatedType === "lead"
            ? "Lead: "
            : appointment.relatedType === "customer"
              ? "Customer: "
              : ""}
          {appointment.relatedLabel}
        </Link>
      ) : (
        appointment.relatedLabel
      ),
  },
  {
    id: "assignedTo",
    header: "Assigned",
    muted: true,
    cell: (appointment) => appointment.assignedTo,
  },
  {
    id: "status",
    header: "Status",
    cell: (appointment) => (
      <StatusBadge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>
        {formatLabel(appointment.status)}
      </StatusBadge>
    ),
  },
];

export function AppointmentSchedule({
  appointments,
  emptyMessage = "No appointments found.",
}: AppointmentScheduleProps) {
  if (appointments.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <DataTable
      data={appointments}
      getRowId={(appointment) => appointment.id}
      columns={COLUMNS}
    />
  );
}
