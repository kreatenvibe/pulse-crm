"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AppointmentCalendar,
  AppointmentFilters,
  AppointmentSchedule,
  buildAppointmentLookups,
  enrichAppointment,
  filterAppointments,
  type ViewMode,
} from "@/components/appointments";
import {
  Button,
  ErrorState,
  LoadingState,
  Pagination,
} from "@/components/ui";
import { useAppointments, useCustomers, useLeads } from "@/hooks";
import { DEFAULT_PAGE_SIZE, paginate } from "@/lib/pagination";
import type { AppointmentStatus } from "@/types/appointment";

export default function AppointmentsPage() {
  const {
    data: appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
  } = useAppointments();
  const { data: leads, loading: leadsLoading, error: leadsError } = useLeads();
  const {
    data: customers,
    loading: customersLoading,
    error: customersError,
  } = useCustomers();

  const [viewMode, setViewMode] = useState<ViewMode>("upcoming");
  const [status, setStatus] = useState<AppointmentStatus | "">("");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [page, setPage] = useState(1);

  const filterKey = `${viewMode}\0${status}\0${month.getFullYear()}-${month.getMonth()}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const loading = appointmentsLoading || leadsLoading || customersLoading;
  const error = appointmentsError ?? leadsError ?? customersError;

  const lookups = useMemo(
    () => buildAppointmentLookups(leads, customers),
    [leads, customers],
  );

  const filteredAppointments = useMemo(() => {
    const filtered = filterAppointments(appointments, {
      viewMode,
      status,
      month,
    });
    return filtered.map((appointment) =>
      enrichAppointment(appointment, lookups),
    );
  }, [appointments, viewMode, status, month, lookups]);

  const { data: pageAppointments, pagination } = paginate(
    filteredAppointments,
    page,
    DEFAULT_PAGE_SIZE,
  );

  if (pagination.page !== page) {
    setPage(pagination.page);
  }

  const emptyMessage =
    viewMode === "upcoming"
      ? "No upcoming appointments match your filters."
      : "No appointments in this month match your filters.";

  return (
    <div className="flex w-full flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Appointments
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            View upcoming meetings or browse appointments by month.
          </p>
        </div>
        <Link href="/appointments/new">
          <Button variant="primary">New appointment</Button>
        </Link>
      </div>

      <AppointmentFilters
        viewMode={viewMode}
        status={status}
        month={month}
        onViewModeChange={setViewMode}
        onStatusChange={setStatus}
        onMonthChange={setMonth}
      />

      {loading ? (
        <LoadingState message="Loading appointments…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : viewMode === "month" ? (
        <AppointmentCalendar month={month} appointments={filteredAppointments} />
      ) : (
        <div className="flex flex-col gap-4">
          <AppointmentSchedule
            appointments={pageAppointments}
            emptyMessage={emptyMessage}
          />
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
