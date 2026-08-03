"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import type { DashboardSummaryDto } from "@/types/dashboard";

const EMPTY_DASHBOARD: DashboardSummaryDto = {
  leads: {
    total: 0,
    byStatus: {
      new: 0,
      contacted: 0,
      qualified: 0,
      appointment_scheduled: 0,
      converted: 0,
      lost: 0,
    },
  },
  customers: {
    total: 0,
    active: 0,
  },
  appointments: {
    total: 0,
    upcoming: 0,
  },
  tasks: {
    total: 0,
    open: 0,
    overdue: 0,
  },
  invoices: {
    total: 0,
    unpaid: 0,
    overdue: 0,
    paidAmountCents: 0,
    byStatus: {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    },
  },
  recentActivityCount: 0,
  upcomingAppointments: [],
  recentActivities: [],
};

export function useDashboard() {
  return useApiQuery<DashboardSummaryDto>(
    "/api/dashboard",
    EMPTY_DASHBOARD,
    "Could not load dashboard. Please try again.",
  );
}
