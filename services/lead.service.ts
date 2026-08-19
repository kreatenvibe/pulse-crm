import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { leads as LeadRow } from "@/lib/generated/prisma/client";
import type { ID, PaginatedResult, PaginationParams } from "@/types/common";
import type {
  ConvertLeadResult,
  LeadAssignee,
  LeadDetails,
} from "@/types/lead-details";
import type { Lead, LeadPriority, LeadSource, LeadStatus } from "@/types/lead";
import {
  CreateLeadSchema,
  UpdateLeadSchema,
  type CreateLeadInput,
  type UpdateLeadInput,
} from "@/lib/schemas/lead.schema";
import { activityService } from "./activity.service";
import { appointmentService } from "./appointment.service";
import { customerService } from "./customer.service";
import { conflict, notFound } from "./errors";
import { nextId, now } from "./helpers";
import { noteService } from "./note.service";
import { taskService } from "./task.service";
import { parseInput } from "./parse";
import { assertUserId } from "./validation";

export type { CreateLeadInput, UpdateLeadInput };

/** Stable order: zero-padded ids sort identically to the original /data array. */
const ORDER_BY_ID = { id: "asc" } as const;

/** Map a Prisma `leads` row (snake_case, nullable) to the domain `Lead`. */
function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone,
    company: row.company ?? undefined,
    status: row.status as LeadStatus,
    source: row.source as LeadSource,
    priority: row.priority as LeadPriority,
    assignedTo: row.assigned_to,
    message: row.message ?? undefined,
    tags: row.tags,
    lastContactedAt: row.last_contacted_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveAssignee(userId: ID): Promise<LeadAssignee> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return {
    id: userId,
    name: user?.name ?? userId,
  };
}

/** Translate a validated partial update into a Prisma column patch. */
function toUpdatePatch(validated: UpdateLeadInput): Prisma.leadsUncheckedUpdateInput {
  const patch: Prisma.leadsUncheckedUpdateInput = { updated_at: now() };

  if ("name" in validated) patch.name = validated.name;
  if ("email" in validated) patch.email = validated.email ?? null;
  if ("phone" in validated) patch.phone = validated.phone;
  if ("company" in validated) patch.company = validated.company ?? null;
  if ("status" in validated) patch.status = validated.status;
  if ("source" in validated) patch.source = validated.source;
  if ("priority" in validated) patch.priority = validated.priority;
  if ("assignedTo" in validated) patch.assigned_to = validated.assignedTo;
  if ("message" in validated) patch.message = validated.message ?? null;
  if ("tags" in validated) patch.tags = validated.tags;
  if ("lastContactedAt" in validated) {
    patch.last_contacted_at = validated.lastContactedAt ?? null;
  }

  return patch;
}

/**
 * Names of tables that still reference this lead, in a stable report order.
 * Scoped defensively by `organizationId` even though `id` itself is already
 * proven org-owned by every caller (`delete` runs this after its own
 * org-scoped existence check) — matches plan.md §9's guidance for exactly
 * this shape of internal dependency count.
 */
async function getLeadDependencies(organizationId: ID, id: ID): Promise<string[]> {
  const deps: string[] = [];

  const [taskCount, apptCount, noteCount, activityCount] = await Promise.all([
    prisma.tasks.count({ where: { lead_id: id, organization_id: organizationId } }),
    prisma.appointments.count({ where: { lead_id: id, organization_id: organizationId } }),
    prisma.notes.count({ where: { entity_type: "lead", entity_id: id, organization_id: organizationId } }),
    prisma.activities.count({ where: { entity_type: "lead", entity_id: id, organization_id: organizationId } }),
  ]);

  if (taskCount > 0) deps.push("tasks");
  if (apptCount > 0) deps.push("appointments");
  if (noteCount > 0) deps.push("notes");
  if (activityCount > 0) deps.push("activities");

  return deps;
}

class LeadService {
  async getAll(organizationId: ID): Promise<Lead[]> {
    const rows = await prisma.leads.findMany({
      where: { organization_id: organizationId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toLead);
  }

  /**
   * Paginated list for `GET /api/leads?page=&pageSize=`.
   * Pages at the database level; keeps the same `{ data, pagination }` shape and
   * clamping rules the in-memory `paginate()` helper used.
   */
  async list(
    organizationId: ID,
    params: Partial<PaginationParams> = {},
  ): Promise<PaginatedResult<Lead>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

    const safePageSize = Math.max(1, Math.floor(pageSize) || DEFAULT_PAGE_SIZE);
    const totalItems = await prisma.leads.count({
      where: { organization_id: organizationId },
    });
    const totalPages =
      totalItems === 0 ? 0 : Math.ceil(totalItems / safePageSize);
    const safePage =
      totalPages === 0
        ? 1
        : Math.min(Math.max(1, Math.floor(page) || 1), totalPages);

    const rows = await prisma.leads.findMany({
      where: { organization_id: organizationId },
      orderBy: ORDER_BY_ID,
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    });

    return {
      data: rows.map(toLead),
      pagination: {
        page: safePage,
        pageSize: safePageSize,
        totalItems,
        totalPages,
      },
    };
  }

  async getById(organizationId: ID, id: ID): Promise<Lead | null> {
    const row = await prisma.leads.findFirst({
      where: { id, organization_id: organizationId },
    });
    return row ? toLead(row) : null;
  }

  async getDetails(organizationId: ID, id: ID): Promise<LeadDetails | null> {
    const lead = await this.getById(organizationId, id);
    if (!lead) return null;

    const [assignedUser, activities, notes, tasks, appointments] =
      await Promise.all([
        resolveAssignee(lead.assignedTo),
        activityService.getTimeline(organizationId, "lead", id),
        noteService.getForEntity(organizationId, "lead", id),
        taskService.getByLeadId(organizationId, id),
        appointmentService.getByLeadId(organizationId, id),
      ]);

    return {
      lead,
      assignedUser,
      activities,
      notes,
      tasks,
      appointments,
    };
  }

  async create(organizationId: ID, data: CreateLeadInput): Promise<Lead> {
    const input = parseInput(CreateLeadSchema, data);
    const assignedTo = await assertUserId(organizationId, input.assignedTo);
    const timestamp = now();

    // Deliberately NOT filtered by organizationId: `id` is a global primary
    // key shared by every org's rows (org-002's seed users are user-101/102,
    // continuing org-001's sequence, not restarting at user-001 — see
    // ADR-025). Scoping this scan per-org would let two orgs generate the
    // same id and collide on the primary key.
    const existing = await prisma.leads.findMany({ select: { id: true } });
    const id = nextId("lead", existing);

    const row = await prisma.leads.create({
      data: {
        id,
        organization_id: organizationId,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone,
        status: input.status,
        source: input.source,
        priority: input.priority,
        company: input.company ?? null,
        message: input.message ?? null,
        tags: input.tags,
        assigned_to: assignedTo,
        last_contacted_at: input.lastContactedAt ?? null,
        created_at: timestamp,
        updated_at: timestamp,
      },
    });

    return toLead(row);
  }

  async update(organizationId: ID, id: ID, data: UpdateLeadInput): Promise<Lead | null> {
    const previous = await this.getById(organizationId, id);
    if (!previous) return null;

    const validated = parseInput(UpdateLeadSchema, data);
    if (validated.assignedTo !== undefined) {
      validated.assignedTo = await assertUserId(organizationId, validated.assignedTo);
    }
    // `getById` above already proved `id` belongs to `organizationId`, so a
    // plain by-id update is safe (matches plan.md §9's suggested alternative).
    const row = await prisma.leads.update({
      where: { id },
      data: toUpdatePatch(validated),
    });
    const updated = toLead(row);

    if (validated.status && validated.status !== previous.status) {
      await activityService.create(organizationId, {
        entityType: "lead",
        entityId: id,
        type: "status_change",
        description: `Status changed from ${previous.status} to ${validated.status}.`,
        performedBy: updated.assignedTo,
        timestamp: now(),
      });
    }

    return updated;
  }

  async delete(organizationId: ID, id: ID): Promise<boolean> {
    const existing = await prisma.leads.findFirst({
      where: { id, organization_id: organizationId },
      select: { id: true },
    });
    if (!existing) return false;

    const customer = await prisma.customers.findUnique({
      where: { lead_id: id },
      select: { id: true },
    });
    if (customer) {
      throw conflict(
        "Cannot delete lead: a converted customer exists for this lead",
      );
    }

    const deps = await getLeadDependencies(organizationId, id);
    if (deps.length > 0) {
      throw conflict(`Cannot delete lead: dependent ${deps.join(", ")} exist`);
    }

    await prisma.leads.delete({ where: { id } });
    return true;
  }

  /**
   * Convert a lead into a customer.
   * Idempotent if already converted and a customer exists for this lead.
   * Migrates related tasks and appointments to the customer.
   *
   * `organizationId` now threads through every downstream call (the
   * Milestone 6 fix plan.md §9 calls out by name) — the created customer,
   * migrated tasks/appointments, and the conversion activity all carry the
   * correct `organization_id`, closing the temporary gap Milestone 5 left
   * (see ADR-025). No transaction wrapping is added here — that remains the
   * separate, already-tracked ADR-019/021 item, unrelated to tenant scoping.
   */
  async convert(organizationId: ID, id: ID): Promise<ConvertLeadResult> {
    const lead = await this.getById(organizationId, id);
    if (!lead) {
      throw notFound("Lead not found");
    }

    const existingCustomer = await customerService.getByLeadId(organizationId, id);
    if (lead.status === "converted" && existingCustomer) {
      return { lead, customer: existingCustomer };
    }

    let customer = existingCustomer;

    if (!customer) {
      customer = await customerService.create(organizationId, {
        leadId: lead.id,
        businessName: lead.company,
        primaryContact: lead.name,
        phone: lead.phone,
        email: lead.email,
        assignedTo: lead.assignedTo,
        lifecycleStatus: "onboarding",
      });
    }

    await taskService.migrateLeadToCustomer(organizationId, lead.id, customer.id);
    await appointmentService.migrateLeadToCustomer(organizationId, lead.id, customer.id);

    const updated =
      lead.status === "converted"
        ? lead
        : (await this.update(organizationId, id, { status: "converted" }))!;

    if (!existingCustomer) {
      await activityService.create(organizationId, {
        entityType: "lead",
        entityId: id,
        type: "updated",
        description: `Lead converted to customer ${customer.id}.`,
        performedBy: lead.assignedTo,
        timestamp: now(),
      });
    }

    return { lead: updated, customer };
  }

  async getByStatus(organizationId: ID, status: LeadStatus): Promise<Lead[]> {
    const rows = await prisma.leads.findMany({
      where: { organization_id: organizationId, status },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toLead);
  }

  async getByAssignee(organizationId: ID, userId: ID): Promise<Lead[]> {
    const rows = await prisma.leads.findMany({
      where: { organization_id: organizationId, assigned_to: userId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toLead);
  }

  async getBySource(organizationId: ID, source: LeadSource): Promise<Lead[]> {
    const rows = await prisma.leads.findMany({
      where: { organization_id: organizationId, source },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toLead);
  }

  async getByPriority(organizationId: ID, priority: LeadPriority): Promise<Lead[]> {
    const rows = await prisma.leads.findMany({
      where: { organization_id: organizationId, priority },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toLead);
  }

  async search(organizationId: ID, query: string): Promise<Lead[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll(organizationId);

    // Tags are a Postgres text[]; a substring match across joined tags can't be
    // expressed with Prisma's typed array filters, so we apply the original
    // case-insensitive substring predicate in-process to preserve behavior.
    const all = await this.getAll(organizationId);
    return all.filter((lead) => {
      const haystack = [
        lead.name,
        lead.email,
        lead.phone,
        lead.company,
        lead.message,
        ...lead.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }
}

export const leadService = new LeadService();
