import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { appointments as AppointmentRow } from "@/lib/generated/prisma/client";
import type { ID } from "@/types/common";
import type { Appointment, AppointmentStatus } from "@/types/appointment";
import {
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
} from "@/lib/schemas/appointment.schema";
import { validation } from "./errors";
import { nextId, now } from "./helpers";
import { parseInput } from "./parse";
import { assertUserId, resolveLeadCustomerLink } from "./validation";

export type { CreateAppointmentInput, UpdateAppointmentInput };

/** Stable order: zero-padded ids sort identically to the original /data array. */
const ORDER_BY_ID = { id: "asc" } as const;

/** Map a Prisma `appointments` row (snake_case, nullable) to the domain `Appointment`. */
function toAppointment(row: AppointmentRow): Appointment {
  return {
    id: row.id,
    leadId: row.lead_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    title: row.title,
    start: row.starts_at,
    end: row.ends_at,
    status: row.status as AppointmentStatus,
    assignedTo: row.assigned_to,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Translate a validated partial update into a Prisma column patch. */
function toUpdatePatch(
  validated: UpdateAppointmentInput,
): Prisma.appointmentsUncheckedUpdateInput {
  const patch: Prisma.appointmentsUncheckedUpdateInput = { updated_at: now() };

  if ("title" in validated) patch.title = validated.title;
  if ("notes" in validated) patch.notes = validated.notes ?? null;
  if ("assignedTo" in validated) patch.assigned_to = validated.assignedTo;
  if ("start" in validated) patch.starts_at = validated.start;
  if ("end" in validated) patch.ends_at = validated.end;
  if ("status" in validated) patch.status = validated.status;
  if ("leadId" in validated || "customerId" in validated) {
    patch.lead_id = validated.leadId ?? null;
    patch.customer_id = validated.customerId ?? null;
  }

  return patch;
}

class AppointmentService {
  async getAll(organizationId: ID): Promise<Appointment[]> {
    const rows = await prisma.appointments.findMany({
      where: { organization_id: organizationId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toAppointment);
  }

  async getById(organizationId: ID, id: ID): Promise<Appointment | null> {
    const row = await prisma.appointments.findFirst({
      where: { id, organization_id: organizationId },
    });
    return row ? toAppointment(row) : null;
  }

  async create(organizationId: ID, data: CreateAppointmentInput): Promise<Appointment> {
    // Schema validates fields + the pure end >= start rule (both dates present).
    const input = parseInput(CreateAppointmentSchema, data);
    // Exactly-one-of + existence for leadId/customerId (DB-backed).
    const link = await resolveLeadCustomerLink(organizationId, input);
    const assignedTo = await assertUserId(organizationId, input.assignedTo);
    const timestamp = now();

    // Deliberately NOT filtered by organizationId — `id` is a global primary
    // key (see lead.service.ts's `create` for the full rationale).
    const existing = await prisma.appointments.findMany({
      select: { id: true },
    });
    const id = nextId("appt", existing);

    const row = await prisma.appointments.create({
      data: {
        id,
        organization_id: organizationId,
        lead_id: link.leadId ?? null,
        customer_id: link.customerId ?? null,
        title: input.title,
        starts_at: input.start,
        ends_at: input.end,
        status: input.status,
        assigned_to: assignedTo,
        notes: input.notes ?? null,
        created_at: timestamp,
        updated_at: timestamp,
      },
    });

    return toAppointment(row);
  }

  async update(
    organizationId: ID,
    id: ID,
    data: UpdateAppointmentInput,
  ): Promise<Appointment | null> {
    const existing = await this.getById(organizationId, id);
    if (!existing) return null;

    const validated = parseInput(UpdateAppointmentSchema, data);
    if (validated.assignedTo !== undefined) {
      validated.assignedTo = await assertUserId(organizationId, validated.assignedTo);
    }
    if (
      "leadId" in validated ||
      "customerId" in validated ||
      validated.leadId !== undefined ||
      validated.customerId !== undefined
    ) {
      const link = await resolveLeadCustomerLink(
        organizationId,
        { leadId: validated.leadId, customerId: validated.customerId },
        existing,
      );
      validated.leadId = link.leadId;
      validated.customerId = link.customerId;
    }
    // end >= start may involve the existing record, so it stays here.
    const start = validated.start ?? existing.start;
    const end = validated.end ?? existing.end;
    if (end < start) {
      throw validation("end must be on or after start");
    }
    const row = await prisma.appointments.update({
      where: { id },
      data: toUpdatePatch(validated),
    });
    return toAppointment(row);
  }

  async delete(organizationId: ID, id: ID): Promise<boolean> {
    const existing = await prisma.appointments.findFirst({
      where: { id, organization_id: organizationId },
      select: { id: true },
    });
    if (!existing) return false;

    await prisma.appointments.delete({ where: { id } });
    return true;
  }

  async getByStatus(organizationId: ID, status: AppointmentStatus): Promise<Appointment[]> {
    const rows = await prisma.appointments.findMany({
      where: { organization_id: organizationId, status },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toAppointment);
  }

  async getByLeadId(organizationId: ID, leadId: ID): Promise<Appointment[]> {
    const rows = await prisma.appointments.findMany({
      where: { organization_id: organizationId, lead_id: leadId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toAppointment);
  }

  async getByCustomerId(organizationId: ID, customerId: ID): Promise<Appointment[]> {
    const rows = await prisma.appointments.findMany({
      where: { organization_id: organizationId, customer_id: customerId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toAppointment);
  }

  async getByAssignee(organizationId: ID, userId: ID): Promise<Appointment[]> {
    const rows = await prisma.appointments.findMany({
      where: { organization_id: organizationId, assigned_to: userId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toAppointment);
  }

  /** Reassign lead appointments to a customer after conversion. */
  async migrateLeadToCustomer(organizationId: ID, leadId: ID, customerId: ID): Promise<number> {
    const result = await prisma.appointments.updateMany({
      where: { lead_id: leadId, organization_id: organizationId },
      data: { lead_id: null, customer_id: customerId, updated_at: now() },
    });
    return result.count;
  }

  /** Future appointments that are still scheduled or confirmed. */
  async getUpcoming(organizationId: ID, from: Date = now()): Promise<Appointment[]> {
    const rows = await prisma.appointments.findMany({
      where: {
        organization_id: organizationId,
        starts_at: { gte: from },
        status: { in: ["scheduled", "confirmed"] },
      },
      orderBy: { starts_at: "asc" },
    });
    return rows.map(toAppointment);
  }

  async getInRange(organizationId: ID, from: Date, to: Date): Promise<Appointment[]> {
    const rows = await prisma.appointments.findMany({
      where: { organization_id: organizationId, starts_at: { gte: from, lte: to } },
      orderBy: { starts_at: "asc" },
    });
    return rows.map(toAppointment);
  }
}

export const appointmentService = new AppointmentService();
