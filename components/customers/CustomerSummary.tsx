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
}: {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-surface-muted/60 px-3.5 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface text-brand shadow-card">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-foreground-muted">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
        <p className="mt-0.5 truncate text-xs text-foreground-secondary">
          {hint}
        </p>
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
    <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Overview</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Snapshot of related work and billing
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryStat
          label="Tasks"
          value={tasks.length}
          hint={`${openTasks} open`}
          icon={<ClipboardList className="size-4" aria-hidden />}
        />
        <SummaryStat
          label="Appointments"
          value={appointments.length}
          hint={`${upcomingAppointments} upcoming`}
          icon={<CalendarDays className="size-4" aria-hidden />}
        />
        <SummaryStat
          label="Services"
          value={services.length}
          hint={`${activeServices} active`}
          icon={<Wrench className="size-4" aria-hidden />}
        />
        <SummaryStat
          label="Invoices"
          value={invoices.length}
          hint={`${openInvoices} unpaid / draft`}
          icon={<FileText className="size-4" aria-hidden />}
        />
      </div>
    </section>
  );
}
