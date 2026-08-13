"use client";

import Link from "next/link";
import { formatTime } from "@/lib/format";
import type { AppointmentStatus } from "@/types/appointment";
import { buildCalendarWeeks, type EnrichedAppointment } from "./utils";

type AppointmentCalendarProps = {
  month: Date;
  appointments: EnrichedAppointment[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_PER_DAY = 3;

// Soft tonal pills with a left accent, harmonized with StatusBadge tones.
const PILL_TONE: Record<AppointmentStatus, string> = {
  scheduled: "border-info bg-info-soft text-info",
  confirmed: "border-success bg-success-soft text-success",
  completed: "border-border-strong bg-neutral-soft text-foreground-secondary",
  cancelled: "border-error bg-error-container text-on-error-container",
  no_show: "border-warning bg-warning-soft text-warning",
};

export function AppointmentCalendar({
  month,
  appointments,
}: AppointmentCalendarProps) {
  const weeks = buildCalendarWeeks(month, appointments);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[44rem] overflow-hidden rounded-md border border-border bg-surface">
        <div className="grid grid-cols-7 border-b border-border bg-surface-muted">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center eyebrow text-foreground-muted"
            >
              {day}
            </div>
          ))}
        </div>

        {weeks.map((week) => (
          <div
            key={week[0].key}
            className="grid grid-cols-7 border-b border-border last:border-b-0"
          >
            {week.map((day) => (
              <div
                key={day.key}
                className={`flex min-h-[7rem] flex-col gap-1 border-r border-border p-1.5 last:border-r-0 ${
                  day.inCurrentMonth ? "bg-surface" : "bg-surface-muted/40"
                }`}
              >
                <div className="flex justify-end">
                  <span
                    className={
                      day.isToday
                        ? "flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-semibold text-foreground-inverse"
                        : `px-1 text-xs font-medium ${
                            day.inCurrentMonth
                              ? "text-foreground-secondary"
                              : "text-foreground-muted"
                          }`
                    }
                  >
                    {day.dayNumber}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  {day.appointments
                    .slice(0, MAX_VISIBLE_PER_DAY)
                    .map((appointment) => (
                      <Link
                        key={appointment.id}
                        href={`/appointments/${appointment.id}`}
                        title={`${formatTime(appointment.start)} · ${appointment.title}`}
                        className={`truncate rounded-r border-l-2 px-1.5 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80 ${PILL_TONE[appointment.status]}`}
                      >
                        <span className="tabular-nums">
                          {formatTime(appointment.start)}
                        </span>{" "}
                        {appointment.title}
                      </Link>
                    ))}
                  {day.appointments.length > MAX_VISIBLE_PER_DAY ? (
                    <span className="px-1.5 text-[11px] font-medium text-foreground-muted">
                      +{day.appointments.length - MAX_VISIBLE_PER_DAY} more
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
