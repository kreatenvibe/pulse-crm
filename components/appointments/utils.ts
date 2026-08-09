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

export function groupAppointmentsByDate(
  appointments: EnrichedAppointment[],
): { dateKey: string; dateLabel: string; items: EnrichedAppointment[] }[] {
  const groups = new Map<string, EnrichedAppointment[]>();

  for (const appointment of appointments) {
    const start = new Date(appointment.start);
    const dateKey = start.toISOString().slice(0, 10);
    const existing = groups.get(dateKey) ?? [];
    existing.push(appointment);
    groups.set(dateKey, existing);
  }

  return Array.from(groups.entries()).map(([dateKey, items]) => {
    const date = new Date(`${dateKey}T12:00:00`);
    const dateLabel = date.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return { dateKey, dateLabel, items };
  });
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
