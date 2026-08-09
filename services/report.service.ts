import {
  APPOINTMENT_STATUSES,
  INVOICE_STATUSES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/lib/schemas/enums";
import type { InvoiceStatus } from "@/types/invoice";
import type { ReportSummary } from "@/types/report";
import { appointmentService } from "./appointment.service";
import { invoiceService } from "./invoice.service";
import { leadService } from "./lead.service";
import { taskService } from "./task.service";

// Business grouping (not a base domain vocabulary): invoices that count as billed.
const BILLED_STATUSES: InvoiceStatus[] = ["sent", "paid", "overdue"];

function countByField<T extends string, Item>(
  items: Item[],
  field: keyof Item,
  values: readonly T[],
): Record<T, number> {
  return Object.fromEntries(
    values.map((value) => [
      value,
      items.filter((item) => item[field] === value).length,
    ]),
  ) as Record<T, number>;
}

function sumAmountCents(
  invoices: { status: InvoiceStatus; amountCents: number }[],
  statuses: InvoiceStatus[],
): number {
  return invoices
    .filter((invoice) => statuses.includes(invoice.status))
    .reduce((sum, invoice) => sum + invoice.amountCents, 0);
}

class ReportService {
  async getSummary(): Promise<ReportSummary> {
    const [leads, appointments, tasks, openTasks, invoices] = await Promise.all([
      leadService.getAll(),
      appointmentService.getAll(),
      taskService.getAll(),
      taskService.getOpen(),
      invoiceService.getAll(),
    ]);

    const converted = leads.filter((lead) => lead.status === "converted").length;
    const conversionRate =
      leads.length > 0 ? Math.round((converted / leads.length) * 100) : 0;

    const completedTasks = tasks.filter((task) => task.status === "done").length;

    return {
      leads: {
        total: leads.length,
        converted,
        conversionRate,
        byStatus: countByField(leads, "status", LEAD_STATUSES),
        bySource: countByField(leads, "source", LEAD_SOURCES),
      },
      appointments: {
        total: appointments.length,
        byStatus: countByField(appointments, "status", APPOINTMENT_STATUSES),
      },
      tasks: {
        total: tasks.length,
        open: openTasks.length,
        completed: completedTasks,
      },
      invoices: {
        total: invoices.length,
        byStatus: countByField(invoices, "status", INVOICE_STATUSES),
        paidAmountCents: sumAmountCents(invoices, ["paid"]),
        outstandingAmountCents: sumAmountCents(invoices, ["sent", "overdue"]),
        totalBilledCents: sumAmountCents(invoices, BILLED_STATUSES),
      },
    };
  }
}

export const reportService = new ReportService();
