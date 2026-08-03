import { EmptyState } from "@/components/ui";
import { formatDateTime, formatLabel } from "@/lib/format";
import type { AppointmentDto } from "@/types/appointment";

type LeadAppointmentsProps = {
  appointments: AppointmentDto[];
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
      <h3 className="border-b border-zinc-200 px-4 py-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      {appointments.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-zinc-500">
          {emptyMessage}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200">
          {appointments.map((appointment) => (
            <li key={appointment.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{appointment.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {formatDateTime(appointment.start)}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-500">
                  {formatLabel(appointment.status)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function LeadAppointments({ appointments }: LeadAppointmentsProps) {
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
    <section className="rounded border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Appointments</h2>
        <p className="text-xs text-zinc-500">Upcoming and past</p>
      </div>

      {appointments.length === 0 ? (
        <EmptyState message="No appointments for this lead." />
      ) : (
        <div className="divide-y divide-zinc-200">
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
