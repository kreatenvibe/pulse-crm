import {
  CalendarDays,
  ClipboardList,
  FileText,
  Wrench,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard";
import type { AppointmentDto } from "@/types/appointment";
import type { InvoiceDto } from "@/types/invoice";
import type { ServiceDto } from "@/types/service";
import type { TaskDto } from "@/types/task";

type CustomerSummaryProps = {
  tasks: TaskDto[];
  appointments: AppointmentDto[];
  services: ServiceDto[];
  invoices: InvoiceDto[];
};

export function CustomerSummary({
  tasks,
  appointments,
  services,
  invoices,
}: CustomerSummaryProps) {
  const now = Date.now();

  const openTasks = tasks.filter(
    (task) => task.status === "todo" || task.status === "in_progress",
  ).length;
  const upcomingAppointments = appointments.filter(
    (appointment) =>
      new Date(appointment.start).getTime() >= now &&
      (appointment.status === "scheduled" ||
        appointment.status === "confirmed"),
  ).length;
  const activeServices = services.filter(
    (service) =>
      service.status === "planned" || service.status === "in_progress",
  ).length;
  const openInvoices = invoices.filter(
    (invoice) =>
      invoice.status === "sent" ||
      invoice.status === "overdue" ||
      invoice.status === "draft",
  ).length;

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <KpiCard
        label="Tasks"
        value={tasks.length}
        hint={`${openTasks} open`}
        icon={<ClipboardList className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <KpiCard
        label="Appointments"
        value={appointments.length}
        hint={`${upcomingAppointments} upcoming`}
        icon={<CalendarDays className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <KpiCard
        label="Services"
        value={services.length}
        hint={`${activeServices} active`}
        icon={<Wrench className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <KpiCard
        label="Invoices"
        value={invoices.length}
        hint={`${openInvoices} unpaid / draft`}
        icon={<FileText className="size-5 stroke-[1.5]" aria-hidden />}
      />
    </div>
  );
}
