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
  FilterBar,
  LoadingState,
  PageHeader,
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
    <div className="flex w-full flex-col">
      <PageHeader
        title="Appointments"
        description="View upcoming meetings or browse appointments by month."
        actions={
          <Link href="/appointments/new">
            <Button variant="primary">New appointment</Button>
          </Link>
        }
      />

      <FilterBar>
        <AppointmentFilters
          viewMode={viewMode}
          status={status}
          month={month}
          onViewModeChange={setViewMode}
          onStatusChange={setStatus}
          onMonthChange={setMonth}
        />
      </FilterBar>

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading appointments…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : viewMode === "month" ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <AppointmentCalendar
            month={month}
            appointments={filteredAppointments}
          />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="px-5 sm:px-6 lg:px-8">
            <AppointmentSchedule
              appointments={pageAppointments}
              emptyMessage={emptyMessage}
            />
          </div>
          <div className="border-t border-border px-5 py-4 sm:px-6 lg:px-8">
            <Pagination pagination={pagination} onPageChange={setPage} />
          </div>
        </div>
      )}
    </div>
  );
}
