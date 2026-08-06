import {
  CalendarDays,
  ClipboardList,
  FileText,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
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

function SummaryStat({
  label,
  value,
  hint,
  icon,
  className = "",
}: {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 py-1 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-foreground-secondary">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          <p className="mt-1 truncate text-xs text-foreground-muted">{hint}</p>
        </div>
        <span className="mt-1 shrink-0 text-brand">{icon}</span>
      </div>
    </div>
  );
}

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
    <section className="border-b border-border px-5 py-6 sm:px-6 lg:px-8">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Overview</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Snapshot of related work and billing
        </p>
      </div>

      <div className="mt-4 grid gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0 xl:divide-x xl:divide-border">
        <SummaryStat
          className="xl:pr-8"
          label="Tasks"
          value={tasks.length}
          hint={`${openTasks} open`}
          icon={<ClipboardList className="size-5 stroke-[1.5]" aria-hidden />}
        />
        <SummaryStat
          className="xl:px-8"
          label="Appointments"
          value={appointments.length}
          hint={`${upcomingAppointments} upcoming`}
          icon={<CalendarDays className="size-5 stroke-[1.5]" aria-hidden />}
        />
        <SummaryStat
          className="xl:px-8"
          label="Services"
          value={services.length}
          hint={`${activeServices} active`}
          icon={<Wrench className="size-5 stroke-[1.5]" aria-hidden />}
        />
        <SummaryStat
          className="xl:pl-8"
          label="Invoices"
          value={invoices.length}
          hint={`${openInvoices} unpaid / draft`}
          icon={<FileText className="size-5 stroke-[1.5]" aria-hidden />}
        />
      </div>
    </section>
  );
}
