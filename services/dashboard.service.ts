import type { DashboardSummary } from "@/types/dashboard";
import type { InvoiceStatus } from "@/types/invoice";
import type { LeadStatus } from "@/types/lead";
import { activityService } from "./activity.service";
import { appointmentService } from "./appointment.service";
import { customerService } from "./customer.service";
import { invoiceService } from "./invoice.service";
import { leadService } from "./lead.service";
import { taskService } from "./task.service";

export type { DashboardSummary };

class DashboardService {
  async getSummary(): Promise<DashboardSummary> {
    const [
      leads,
      customers,
      activeCustomers,
      appointments,
      upcoming,
      tasks,
      openTasks,
      overdueTasks,
      invoices,
      unpaidInvoices,
      overdueInvoices,
      recentActivities,
    ] = await Promise.all([
      leadService.getAll(),
      customerService.getAll(),
      customerService.getActive(),
      appointmentService.getAll(),
      appointmentService.getUpcoming(),
      taskService.getAll(),
      taskService.getOpen(),
      taskService.getOverdue(),
      invoiceService.getAll(),
      invoiceService.getUnpaid(),
      invoiceService.getOverdue(),
      activityService.getRecent(20),
    ]);

    const leadStatuses: LeadStatus[] = [
      "new",
      "contacted",
      "qualified",
      "appointment_scheduled",
      "converted",
      "lost",
    ];
    const byStatus = Object.fromEntries(
      leadStatuses.map((status) => [
        status,
        leads.filter((lead) => lead.status === status).length,
      ]),
    ) as Record<LeadStatus, number>;

    const invoiceStatuses: InvoiceStatus[] = [
      "draft",
      "sent",
      "paid",
      "overdue",
      "cancelled",
    ];
    const invoiceByStatus = Object.fromEntries(
      invoiceStatuses.map((status) => [
        status,
        invoices.filter((invoice) => invoice.status === status).length,
      ]),
    ) as Record<InvoiceStatus, number>;

    const paidAmountCents = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.amountCents, 0);

    return {
      leads: {
        total: leads.length,
        byStatus,
      },
      customers: {
        total: customers.length,
        active: activeCustomers.length,
      },
      appointments: {
        total: appointments.length,
        upcoming: upcoming.length,
      },
      tasks: {
        total: tasks.length,
        open: openTasks.length,
        overdue: overdueTasks.length,
      },
      invoices: {
        total: invoices.length,
        unpaid: unpaidInvoices.length,
        overdue: overdueInvoices.length,
        paidAmountCents,
        byStatus: invoiceByStatus,
      },
      recentActivityCount: recentActivities.length,
      upcomingAppointments: upcoming.slice(0, 8),
      recentActivities: recentActivities.slice(0, 10),
    };
  }
}

export const dashboardService = new DashboardService();
