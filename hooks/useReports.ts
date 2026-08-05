"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import type { ReportSummaryDto } from "@/types/report";

const EMPTY_REPORTS: ReportSummaryDto = {
  leads: {
    total: 0,
    converted: 0,
    conversionRate: 0,
    byStatus: {
      new: 0,
      contacted: 0,
      qualified: 0,
      appointment_scheduled: 0,
      converted: 0,
      lost: 0,
    },
    bySource: {
      website: 0,
      whatsapp: 0,
      facebook: 0,
      instagram: 0,
      google: 0,
      referral: 0,
      walk_in: 0,
      phone: 0,
    },
  },
  appointments: {
    total: 0,
    byStatus: {
      scheduled: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    },
  },
  tasks: {
    total: 0,
    open: 0,
    completed: 0,
  },
  invoices: {
    total: 0,
    byStatus: {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    },
    paidAmountCents: 0,
    outstandingAmountCents: 0,
    totalBilledCents: 0,
  },
};

export function useReports() {
  return useApiQuery<ReportSummaryDto>(
    "/api/reports",
    EMPTY_REPORTS,
    "Could not load reports. Please try again.",
  );
}
