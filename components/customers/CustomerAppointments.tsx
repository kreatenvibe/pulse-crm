import { StatusBadge, type StatusBadgeTone } from "@/components/ui";
import { formatDateTime, formatLabel } from "@/lib/format";
import type { AppointmentDto, AppointmentStatus } from "@/types/appointment";

type CustomerAppointmentsProps = {
  appointments: AppointmentDto[];
};

const STATUS_TONE: Record<AppointmentStatus, StatusBadgeTone> = {
  scheduled: "info",
  confirmed: "success",
  completed: "neutral",
  cancelled: "danger",
  no_show: "warning",
};

function AppointmentList({
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
      <h3 className="border-b border-border px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {title}
      </h3>
      {appointments.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-foreground-muted">
          {emptyMessage}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="px-5 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {appointment.title}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {formatDateTime(appointment.start)}
                  </p>
                </div>
                <StatusBadge tone={STATUS_TONE[appointment.status]}>
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

export function CustomerAppointments({
  appointments,
}: CustomerAppointmentsProps) {
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
    <section className="rounded-xl border border-border bg-surface shadow-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Appointments</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Upcoming and past
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-foreground-muted">
          No appointments for this customer.
        </div>
      ) : (
        <div className="divide-y divide-border">
          <AppointmentList
            title="Upcoming"
            appointments={upcoming}
            emptyMessage="No upcoming appointments."
          />
          <AppointmentList
            title="Past"
            appointments={past}
            emptyMessage="No past appointments."
          />
        </div>
      )}
    </section>
  );
}
