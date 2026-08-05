import Link from "next/link";
import { formatDate, formatLabel, formatTimeRange } from "@/lib/format";
import type { AppointmentDto, AppointmentStatus } from "@/types/appointment";

type UpcomingAppointmentsProps = {
  appointments: AppointmentDto[];
};

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  scheduled: "bg-info-soft text-info",
  confirmed: "bg-success-soft text-success",
  completed: "bg-neutral-soft text-neutral",
  cancelled: "bg-danger-soft text-danger",
  no_show: "bg-warning-soft text-warning",
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
    <section className="rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
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
        <div className="px-5 py-10 text-center text-sm text-foreground-muted">
          No upcoming appointments.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-foreground-muted">
                <th className="px-5 py-3 font-medium">Time</th>
                <th className="px-5 py-3 font-medium">Appointment</th>
                <th className="px-5 py-3 font-medium">Related</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="whitespace-nowrap px-5 py-3.5 text-foreground-secondary">
                    <div className="tabular-nums">
                      {formatTimeRange(appointment.start, appointment.end)}
                    </div>
                    <div className="text-xs text-foreground-muted">
                      {formatDate(appointment.start)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-foreground">
                      {appointment.title}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      Assigned to {appointment.assignedTo}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-foreground-secondary">
                    {relatedLabel(appointment)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${STATUS_BADGE[appointment.status]}`}
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
