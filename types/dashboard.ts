import type { Activity, ActivityDto } from "./activity";
import type { Appointment, AppointmentDto } from "./appointment";
import type { InvoiceStatus } from "./invoice";
import type { LeadStatus } from "./lead";

type DashboardStats = {
  leads: {
    total: number;
    byStatus: Record<LeadStatus, number>;
  };
  customers: {
    total: number;
    active: number;
  };
  appointments: {
    total: number;
    upcoming: number;
  };
  tasks: {
    total: number;
    open: number;
    overdue: number;
  };
  invoices: {
    total: number;
    unpaid: number;
    overdue: number;
    paidAmountCents: number;
    byStatus: Record<InvoiceStatus, number>;
  };
  recentActivityCount: number;
};

/** Domain shape returned by the dashboard service (Date objects). */
export type DashboardSummary = DashboardStats & {
  upcomingAppointments: Appointment[];
  recentActivities: Activity[];
};

/** Wire shape from `/api/dashboard` (ISO date strings). */
export type DashboardSummaryDto = DashboardStats & {
  upcomingAppointments: AppointmentDto[];
  recentActivities: ActivityDto[];
};
