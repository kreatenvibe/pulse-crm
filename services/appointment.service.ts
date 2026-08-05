import { appointments } from "@/data/appointments";
import type { ID } from "@/types/common";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import { ServiceError } from "./errors";
import { nextId, now } from "./helpers";
import {
  assertEnum,
  assertOptionalString,
  assertRequiredString,
  assertUserId,
  resolveLeadCustomerLink,
  toDate,
} from "./validation";

export type CreateAppointmentInput = Omit<
  Appointment,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

function validateCreateInput(
  data: CreateAppointmentInput,
): CreateAppointmentInput {
  const link = resolveLeadCustomerLink(data);
  const start = toDate(data.start, "start");
  const end = toDate(data.end, "end");

  if (end < start) {
    throw new ServiceError("end must be on or after start", "VALIDATION");
  }

  return {
    ...link,
    title: assertRequiredString(data.title, "title"),
    start,
    end,
    status: assertEnum(data.status, APPOINTMENT_STATUSES, "status"),
    assignedTo: assertUserId(data.assignedTo),
    notes: assertOptionalString(data.notes, "notes"),
  };
}

function validateUpdateInput(
  data: UpdateAppointmentInput,
  existing: Appointment,
): UpdateAppointmentInput {
  const validated: UpdateAppointmentInput = {};

  if ("title" in data && data.title !== undefined) {
    validated.title = assertRequiredString(data.title, "title");
  }
  if ("notes" in data) {
    validated.notes = assertOptionalString(data.notes, "notes");
  }
  if ("assignedTo" in data && data.assignedTo !== undefined) {
    validated.assignedTo = assertUserId(data.assignedTo);
  }
  if (
    "leadId" in data ||
    "customerId" in data ||
    data.leadId !== undefined ||
    data.customerId !== undefined
  ) {
    validated.leadId = data.leadId;
    validated.customerId = data.customerId;
    const link = resolveLeadCustomerLink(validated, existing);
    validated.leadId = link.leadId;
    validated.customerId = link.customerId;
  }
  if ("start" in data && data.start !== undefined) {
    validated.start = toDate(data.start, "start");
  }
  if ("end" in data && data.end !== undefined) {
    validated.end = toDate(data.end, "end");
  }
  if ("status" in data && data.status !== undefined) {
    validated.status = assertEnum(
      data.status,
      APPOINTMENT_STATUSES,
      "status",
    );
  }

  const start = validated.start ?? existing.start;
  const end = validated.end ?? existing.end;
  if (end < start) {
    throw new ServiceError("end must be on or after start", "VALIDATION");
  }

  return validated;
}

class AppointmentService {
  async getAll(): Promise<Appointment[]> {
    return [...appointments];
  }

  async getById(id: ID): Promise<Appointment | null> {
    return appointments.find((appointment) => appointment.id === id) ?? null;
  }

  async create(data: CreateAppointmentInput): Promise<Appointment> {
    const validated = validateCreateInput(data);
    const timestamp = now();
    const appointment: Appointment = {
      ...validated,
      id: nextId("appt", appointments),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    appointments.push(appointment);
    return appointment;
  }

  async update(
    id: ID,
    data: UpdateAppointmentInput,
  ): Promise<Appointment | null> {
    const index = appointments.findIndex((appointment) => appointment.id === id);
    if (index === -1) return null;

    const validated = validateUpdateInput(data, appointments[index]);
    const updated: Appointment = {
      ...appointments[index],
      ...validated,
      id,
      updatedAt: now(),
    };
    appointments[index] = updated;
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const index = appointments.findIndex((appointment) => appointment.id === id);
    if (index === -1) return false;
    appointments.splice(index, 1);
    return true;
  }

  async getByStatus(status: AppointmentStatus): Promise<Appointment[]> {
    return appointments.filter((appointment) => appointment.status === status);
  }

  async getByLeadId(leadId: ID): Promise<Appointment[]> {
    return appointments.filter((appointment) => appointment.leadId === leadId);
  }

  async getByCustomerId(customerId: ID): Promise<Appointment[]> {
    return appointments.filter(
      (appointment) => appointment.customerId === customerId,
    );
  }

  async getByAssignee(userId: ID): Promise<Appointment[]> {
    return appointments.filter(
      (appointment) => appointment.assignedTo === userId,
    );
  }

  /** Reassign lead appointments to a customer after conversion. */
  async migrateLeadToCustomer(leadId: ID, customerId: ID): Promise<number> {
    let count = 0;
    for (const appointment of appointments) {
      if (appointment.leadId === leadId) {
        appointment.leadId = undefined;
        appointment.customerId = customerId;
        appointment.updatedAt = now();
        count += 1;
      }
    }
    return count;
  }

  /** Future appointments that are still scheduled or confirmed. */
  async getUpcoming(from: Date = now()): Promise<Appointment[]> {
    return appointments
      .filter(
        (appointment) =>
          appointment.start >= from &&
          (appointment.status === "scheduled" ||
            appointment.status === "confirmed"),
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }

  async getInRange(from: Date, to: Date): Promise<Appointment[]> {
    return appointments
      .filter(
        (appointment) => appointment.start >= from && appointment.start <= to,
      )
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }
}

export const appointmentService = new AppointmentService();
