import { EmptyState } from "@/components/ui";
import { formatDateTime, formatLabel } from "@/lib/format";
import type { AppointmentDto } from "@/types/appointment";

type UpcomingAppointmentsProps = {
  appointments: AppointmentDto[];
};

export function UpcomingAppointments({
  appointments,
}: UpcomingAppointmentsProps) {
  return (
    <section className="rounded border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Upcoming appointments</h2>
        <p className="text-xs text-zinc-500">Next scheduled meetings</p>
      </div>

      {appointments.length === 0 ? (
        <EmptyState message="No upcoming appointments." />
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
              <p className="mt-1 text-xs text-zinc-500">
                Assigned to {appointment.assignedTo}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
