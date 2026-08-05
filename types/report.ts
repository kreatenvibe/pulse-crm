import type { AppointmentStatus } from "./appointment";
import type { InvoiceStatus } from "./invoice";
import type { LeadSource, LeadStatus } from "./lead";

/** Aggregated analytics derived from existing domain data (no dates). */
export type ReportSummary = {
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
    byStatus: Record<LeadStatus, number>;
    bySource: Record<LeadSource, number>;
  };
  appointments: {
    total: number;
    byStatus: Record<AppointmentStatus, number>;
  };
  tasks: {
    total: number;
    open: number;
    completed: number;
  };
  invoices: {
    total: number;
    byStatus: Record<InvoiceStatus, number>;
    paidAmountCents: number;
    outstandingAmountCents: number;
    totalBilledCents: number;
  };
};

/** Wire shape from `/api/reports` (same as domain — no date fields). */
export type ReportSummaryDto = ReportSummary;
