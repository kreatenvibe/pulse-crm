import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { formatDate, formatLabel, formatTime } from "@/lib/format";
import type { AppointmentDto, AppointmentStatus } from "@/types/appointment";

type UpcomingAppointmentsProps = {
  appointments: AppointmentDto[];
};

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  scheduled: "border-info/35 text-info",
  confirmed: "border-success/35 text-success",
  completed: "border-border-strong text-neutral",
  cancelled: "border-danger/35 text-danger",
  no_show: "border-warning/40 text-warning",
};

function relatedLabel(appointment: AppointmentDto): string {
  if (appointment.customerId) return appointment.customerId;
  if (appointment.leadId) return appointment.leadId;
  return "Unlinked";
}

export function UpcomingAppointments({
  appointments,
}: UpcomingAppointmentsProps) {
  return (
    <section className="border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Upcoming appointments
          </h2>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Next scheduled meetings
          </p>
        </div>
        <Link
          href="/appointments"
          className="text-xs font-medium text-brand hover:text-brand-hover"
        >
          View calendar
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="py-12 text-center text-sm text-foreground-muted">
          No upcoming appointments.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {appointments.map((appointment) => (
            <li
              key={appointment.id}
              className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-surface-muted"
            >
              <div className="w-20 shrink-0">
                <div className="text-sm font-semibold text-foreground tabular-nums">
                  {formatTime(appointment.start)}
                </div>
                <div className="text-xs text-foreground-muted">
                  {formatDate(appointment.start)}
                </div>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <CalendarClock
                  className="size-4 shrink-0 text-foreground-muted stroke-[1.5]"
                  aria-hidden
                />
                <span className="truncate text-sm text-foreground">
                  {appointment.title}
                </span>
              </div>
              <span className="hidden truncate rounded-md bg-surface-muted px-2 py-0.5 text-xs text-foreground-secondary sm:inline-block">
                {relatedLabel(appointment)}
              </span>
              <span
                className={`inline-flex shrink-0 rounded-md border bg-transparent px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase ${STATUS_BADGE[appointment.status]}`}
              >
                {formatLabel(appointment.status)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
