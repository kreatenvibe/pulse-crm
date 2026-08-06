import Link from "next/link";
import { formatDate, formatLabel, formatTimeRange } from "@/lib/format";
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
  if (appointment.customerId) return `Customer · ${appointment.customerId}`;
  if (appointment.leadId) return `Lead · ${appointment.leadId}`;
  return "Unlinked";
}

export function UpcomingAppointments({
  appointments,
}: UpcomingAppointmentsProps) {
  return (
    <section>
      <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
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
          View all
        </Link>
      </div>

      {appointments.length === 0 ? (
        <div className="py-10 text-center text-sm text-foreground-muted">
          No upcoming appointments.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-md text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] tracking-[0.06em] text-foreground-muted uppercase">
                <th className="px-0 py-3 pr-4 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Appointment</th>
                <th className="px-4 py-3 font-medium">Related</th>
                <th className="px-4 py-3 pl-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="border-b border-border last:border-b-0">
                  <td className="whitespace-nowrap py-4 pr-4 text-foreground-secondary">
                    <div className="tabular-nums">
                      {formatTimeRange(appointment.start, appointment.end)}
                    </div>
                    <div className="text-xs text-foreground-muted">
                      {formatDate(appointment.start)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-foreground">
                      {appointment.title}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      Assigned to {appointment.assignedTo}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-foreground-secondary">
                    {relatedLabel(appointment)}
                  </td>
                  <td className="py-4 pl-4">
                    <span
                      className={`inline-flex rounded-md border bg-transparent px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase ${STATUS_BADGE[appointment.status]}`}
                    >
                      {formatLabel(appointment.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
