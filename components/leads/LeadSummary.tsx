import {
  CalendarDays,
  ClipboardList,
  Clock,
  MessageSquare,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard";
import type { ActivityDto } from "@/types/activity";
import type { AppointmentDto } from "@/types/appointment";
import type { LeadDto } from "@/types/lead";
import type { TaskDto } from "@/types/task";

type LeadSummaryProps = {
  lead: LeadDto;
  activities: ActivityDto[];
  appointments: AppointmentDto[];
  tasks: TaskDto[];
};

const DAY_MS = 86_400_000;

export function LeadSummary({
  lead,
  activities,
  appointments,
  tasks,
}: LeadSummaryProps) {
  const now = Date.now();

  const ageDays = Math.max(
    0,
    Math.floor((now - new Date(lead.createdAt).getTime()) / DAY_MS),
  );
  const upcomingAppointments = appointments.filter(
    (appointment) =>
      new Date(appointment.start).getTime() >= now &&
      (appointment.status === "scheduled" ||
        appointment.status === "confirmed"),
  ).length;
  const openTasks = tasks.filter(
    (task) => task.status === "todo" || task.status === "in_progress",
  ).length;

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <KpiCard
        label="Lead age"
        value={ageDays}
        hint={ageDays === 1 ? "day in pipeline" : "days in pipeline"}
        icon={<Clock className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <KpiCard
        label="Activities"
        value={activities.length}
        hint="logged interactions"
        icon={<MessageSquare className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <KpiCard
        label="Appointments"
        value={appointments.length}
        hint={`${upcomingAppointments} upcoming`}
        icon={<CalendarDays className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <KpiCard
        label="Tasks"
        value={tasks.length}
        hint={`${openTasks} open`}
        icon={<ClipboardList className="size-5 stroke-[1.5]" aria-hidden />}
      />
    </div>
  );
}
