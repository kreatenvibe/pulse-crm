import { INVOICE_STATUSES, LEAD_STATUSES } from "@/lib/schemas/enums";
import type { ID } from "@/types/common";
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
  async getSummary(organizationId: ID): Promise<DashboardSummary> {
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
      leadService.getAll(organizationId),
      customerService.getAll(organizationId),
      customerService.getActive(organizationId),
      appointmentService.getAll(organizationId),
      appointmentService.getUpcoming(organizationId),
      taskService.getAll(organizationId),
      taskService.getOpen(organizationId),
      taskService.getOverdue(organizationId),
      invoiceService.getAll(organizationId),
      invoiceService.getUnpaid(organizationId),
      invoiceService.getOverdue(organizationId),
      activityService.getRecent(organizationId, 20),
    ]);

    const byStatus = Object.fromEntries(
      LEAD_STATUSES.map((status) => [
        status,
        leads.filter((lead) => lead.status === status).length,
      ]),
    ) as Record<LeadStatus, number>;

    const invoiceByStatus = Object.fromEntries(
      INVOICE_STATUSES.map((status) => [
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
