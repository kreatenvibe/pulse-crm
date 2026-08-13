import type { AppointmentDto, AppointmentStatus } from "@/types/appointment";
import type { CustomerDto } from "@/types/customer";
import type { LeadDto } from "@/types/lead";

// Single source of truth for domain vocabularies: lib/schemas/enums.ts.
export { APPOINTMENT_STATUSES } from "@/lib/schemas/enums";

export type ViewMode = "upcoming" | "month";

export type AppointmentLookups = {
  leadsById: Map<string, LeadDto>;
  customersById: Map<string, CustomerDto>;
};

export type EnrichedAppointment = AppointmentDto & {
  relatedLabel: string;
  relatedHref: string | null;
  relatedType: "lead" | "customer" | null;
};

export function buildAppointmentLookups(
  leads: LeadDto[],
  customers: CustomerDto[],
): AppointmentLookups {
  return {
    leadsById: new Map(leads.map((lead) => [lead.id, lead])),
    customersById: new Map(customers.map((customer) => [customer.id, customer])),
  };
}

export function enrichAppointment(
  appointment: AppointmentDto,
  lookups: AppointmentLookups,
): EnrichedAppointment {
  if (appointment.leadId) {
    const lead = lookups.leadsById.get(appointment.leadId);
    return {
      ...appointment,
      relatedType: "lead",
      relatedLabel: lead?.name ?? appointment.leadId,
      relatedHref: `/leads/${appointment.leadId}`,
    };
  }

  if (appointment.customerId) {
    const customer = lookups.customersById.get(appointment.customerId);
    const label =
      customer?.businessName?.trim() ||
      customer?.primaryContact ||
      appointment.customerId;
    return {
      ...appointment,
      relatedType: "customer",
      relatedLabel: label,
      relatedHref: `/customers/${appointment.customerId}`,
    };
  }

  return {
    ...appointment,
    relatedType: null,
    relatedLabel: "—",
    relatedHref: null,
  };
}

function isUpcoming(appointment: AppointmentDto, now: Date): boolean {
  const start = new Date(appointment.start);
  return (
    start >= now &&
    (appointment.status === "scheduled" || appointment.status === "confirmed")
  );
}

function isInMonth(appointment: AppointmentDto, month: Date): boolean {
  const start = new Date(appointment.start);
  return (
    start.getFullYear() === month.getFullYear() &&
    start.getMonth() === month.getMonth()
  );
}

export function filterAppointments(
  appointments: AppointmentDto[],
  options: {
    viewMode: ViewMode;
    status: AppointmentStatus | "";
    month: Date;
    now?: Date;
  },
): AppointmentDto[] {
  const now = options.now ?? new Date();

  const filtered = appointments.filter((appointment) => {
    if (options.status && appointment.status !== options.status) return false;
    if (options.viewMode === "upcoming") return isUpcoming(appointment, now);
    return isInMonth(appointment, options.month);
  });

  return filtered.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
}

export type CalendarDay = {
  date: Date;
  key: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  appointments: EnrichedAppointment[];
};

/** Local (not UTC) YYYY-MM-DD key so appointments land on the day the user sees. */
function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Build the weeks for a month calendar grid. The grid always starts on the
 * Sunday on/before the 1st and ends on the Saturday on/after the last day, so
 * leading/trailing days from adjacent months fill out complete weeks.
 * Appointments are expected pre-sorted by start (see filterAppointments).
 */
export function buildCalendarWeeks(
  month: Date,
  appointments: EnrichedAppointment[],
  today: Date = new Date(),
): CalendarDay[][] {
  const byDay = new Map<string, EnrichedAppointment[]>();
  for (const appointment of appointments) {
    const key = toLocalDateKey(new Date(appointment.start));
    const existing = byDay.get(key) ?? [];
    existing.push(appointment);
    byDay.set(key, existing);
  }

  const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(1 - firstOfMonth.getDay());

  const lastOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

  const todayKey = toLocalDateKey(today);
  const weeks: CalendarDay[][] = [];
  const cursor = new Date(gridStart);

  while (cursor <= gridEnd) {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const key = toLocalDateKey(cursor);
      week.push({
        date: new Date(cursor),
        key,
        dayNumber: cursor.getDate(),
        inCurrentMonth: cursor.getMonth() === month.getMonth(),
        isToday: key === todayKey,
        appointments: byDay.get(key) ?? [],
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

export function formatMonthLabel(month: Date): string {
  return month.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export function shiftMonth(month: Date, delta: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + delta, 1);
}
