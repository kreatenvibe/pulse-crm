import { StatusBadge } from "@/components/ui";
import { formatDateTime, formatLabel } from "@/lib/format";
import { APPOINTMENT_STATUS_TONE } from "@/lib/status-tone";
import type { AppointmentDto } from "@/types/appointment";

type AppointmentsPanelProps = {
  appointments: AppointmentDto[];
  /** Shown when the entity has no appointments at all (e.g. per lead/customer). */
  emptyMessage: string;
};

function AppointmentGroup({
  title,
  appointments,
  emptyMessage,
}: {
  title: string;
  appointments: AppointmentDto[];
  emptyMessage: string;
}) {
  return (
    <div>
      <h3 className="border-b border-border px-5 py-2.5 eyebrow text-foreground-muted sm:px-6">
        {title}
      </h3>
      {appointments.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-foreground-muted sm:px-6">
          {emptyMessage}
        </p>
      ) : (
        <ul>
          {appointments.map((appointment) => (
            <li
              key={appointment.id}
              className="border-b border-border px-5 py-3.5 last:border-b-0 sm:px-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {appointment.title}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {formatDateTime(appointment.start)}
                  </p>
                </div>
                <StatusBadge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>
                  {formatLabel(appointment.status)}
                </StatusBadge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Appointment list grouped into upcoming/past, shared by lead and customer
 * detail pages. `emptyMessage` covers the "no appointments at all" case.
 */
export function AppointmentsPanel({
  appointments,
  emptyMessage,
}: AppointmentsPanelProps) {
  const now = Date.now();
  const upcoming = appointments
    .filter((appointment) => new Date(appointment.start).getTime() >= now)
    .sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  const past = appointments
    .filter((appointment) => new Date(appointment.start).getTime() < now)
    .sort(
      (a, b) => new Date(b.start).getTime() - new Date(a.start).getTime(),
    );

  return (
    <section className="h-full border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-foreground">Appointments</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Upcoming and past
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-foreground-muted sm:px-6">
          {emptyMessage}
        </div>
      ) : (
        <div>
          <AppointmentGroup
            title="Upcoming"
            appointments={upcoming}
            emptyMessage="No upcoming appointments."
          />
          <AppointmentGroup
            title="Past"
            appointments={past}
            emptyMessage="No past appointments."
          />
        </div>
      )}
    </section>
  );
}
