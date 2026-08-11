"use client";

import Link from "next/link";
import {
  EmptyState,
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/ui";
import { formatLabel, formatTimeRange } from "@/lib/format";
import type { AppointmentStatus } from "@/types/appointment";
import type { EnrichedAppointment } from "./utils";
import { groupAppointmentsByDate } from "./utils";

type AppointmentScheduleProps = {
  appointments: EnrichedAppointment[];
  emptyMessage?: string;
};

const STATUS_TONE: Record<AppointmentStatus, StatusBadgeTone> = {
  scheduled: "info",
  confirmed: "success",
  completed: "neutral",
  cancelled: "danger",
  no_show: "warning",
};

export function AppointmentSchedule({
  appointments,
  emptyMessage = "No appointments found.",
}: AppointmentScheduleProps) {
  if (appointments.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const groups = groupAppointmentsByDate(appointments);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section
          key={group.dateKey}
          className="border-y border-border"
        >
          <header className="border-b border-border bg-surface-muted/50 px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              {group.dateLabel}
            </h2>
            <p className="mt-0.5 text-xs text-foreground-muted">
              {group.items.length}{" "}
              {group.items.length === 1 ? "appointment" : "appointments"}
            </p>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-xs font-medium text-foreground-muted">
                    Time
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-foreground-muted">
                    Appointment
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-foreground-muted">
                    Related
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-foreground-muted">
                    Assigned
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-foreground-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {group.items.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="bg-surface transition-colors hover:bg-surface-muted/70"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-foreground-secondary tabular-nums">
                      {formatTimeRange(appointment.start, appointment.end)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/appointments/${appointment.id}`}
                        className="font-medium text-brand hover:text-brand-hover hover:underline"
                      >
                        {appointment.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-foreground-secondary">
                      {appointment.relatedHref ? (
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
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-foreground-secondary">
                      {appointment.assignedTo}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge tone={STATUS_TONE[appointment.status]}>
                        {formatLabel(appointment.status)}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
