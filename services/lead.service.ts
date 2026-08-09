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
import { ServiceError } from "./errors";
import { nextId, now } from "./helpers";
import { noteService } from "./note.service";
import { taskService } from "./task.service";
import { assertUserId, parseInput } from "./validation";

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

/** Names of tables that still reference this lead, in a stable report order. */
async function getLeadDependencies(id: ID): Promise<string[]> {
  const deps: string[] = [];

  const [taskCount, apptCount, noteCount, activityCount] = await Promise.all([
    prisma.tasks.count({ where: { lead_id: id } }),
    prisma.appointments.count({ where: { lead_id: id } }),
    prisma.notes.count({ where: { entity_type: "lead", entity_id: id } }),
    prisma.activities.count({ where: { entity_type: "lead", entity_id: id } }),
  ]);

  if (taskCount > 0) deps.push("tasks");
  if (apptCount > 0) deps.push("appointments");
  if (noteCount > 0) deps.push("notes");
  if (activityCount > 0) deps.push("activities");

  return deps;
}

class LeadService {
  async getAll(): Promise<Lead[]> {
    const rows = await prisma.leads.findMany({ orderBy: ORDER_BY_ID });
    return rows.map(toLead);
  }

  /**
   * Paginated list for `GET /api/leads?page=&pageSize=`.
   * Pages at the database level; keeps the same `{ data, pagination }` shape and
   * clamping rules the in-memory `paginate()` helper used.
   */
  async list(
    params: Partial<PaginationParams> = {},
  ): Promise<PaginatedResult<Lead>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;

    const safePageSize = Math.max(1, Math.floor(pageSize) || DEFAULT_PAGE_SIZE);
    const totalItems = await prisma.leads.count();
    const totalPages =
      totalItems === 0 ? 0 : Math.ceil(totalItems / safePageSize);
    const safePage =
      totalPages === 0
        ? 1
        : Math.min(Math.max(1, Math.floor(page) || 1), totalPages);

    const rows = await prisma.leads.findMany({
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

  async getById(id: ID): Promise<Lead | null> {
    const row = await prisma.leads.findUnique({ where: { id } });
    return row ? toLead(row) : null;
  }

  async getDetails(id: ID): Promise<LeadDetails | null> {
    const lead = await this.getById(id);
    if (!lead) return null;

    const [assignedUser, activities, notes, tasks, appointments] =
      await Promise.all([
        resolveAssignee(lead.assignedTo),
        activityService.getTimeline("lead", id),
        noteService.getForEntity("lead", id),
        taskService.getByLeadId(id),
        appointmentService.getByLeadId(id),
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

  async create(data: CreateLeadInput): Promise<Lead> {
    const input = parseInput(CreateLeadSchema, data);
    const assignedTo = await assertUserId(input.assignedTo);
    const timestamp = now();

    const existing = await prisma.leads.findMany({ select: { id: true } });
    const id = nextId("lead", existing);

    const row = await prisma.leads.create({
      data: {
        id,
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

  async update(id: ID, data: UpdateLeadInput): Promise<Lead | null> {
    const previous = await this.getById(id);
    if (!previous) return null;

    const validated = parseInput(UpdateLeadSchema, data);
    if (validated.assignedTo !== undefined) {
      validated.assignedTo = await assertUserId(validated.assignedTo);
    }
    const row = await prisma.leads.update({
      where: { id },
      data: toUpdatePatch(validated),
    });
    const updated = toLead(row);

    if (validated.status && validated.status !== previous.status) {
      await activityService.create({
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

  async delete(id: ID): Promise<boolean> {
    const existing = await prisma.leads.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return false;

    const customer = await prisma.customers.findUnique({
      where: { lead_id: id },
      select: { id: true },
    });
    if (customer) {
      throw new ServiceError(
        "Cannot delete lead: a converted customer exists for this lead",
        "CONFLICT",
      );
    }

    const deps = await getLeadDependencies(id);
    if (deps.length > 0) {
      throw new ServiceError(
        `Cannot delete lead: dependent ${deps.join(", ")} exist`,
        "CONFLICT",
      );
    }

    await prisma.leads.delete({ where: { id } });
    return true;
  }

  /**
   * Convert a lead into a customer.
   * Idempotent if already converted and a customer exists for this lead.
   * Migrates related tasks and appointments to the customer.
   */
  async convert(id: ID): Promise<ConvertLeadResult> {
    const lead = await this.getById(id);
    if (!lead) {
      throw new ServiceError("Lead not found", "NOT_FOUND");
    }

    const existingCustomer = await customerService.getByLeadId(id);
    if (lead.status === "converted" && existingCustomer) {
      return { lead, customer: existingCustomer };
    }

    let customer = existingCustomer;

    if (!customer) {
      customer = await customerService.create({
        leadId: lead.id,
        businessName: lead.company,
        primaryContact: lead.name,
        phone: lead.phone,
        email: lead.email,
        assignedTo: lead.assignedTo,
        lifecycleStatus: "onboarding",
      });
    }

    await taskService.migrateLeadToCustomer(lead.id, customer.id);
    await appointmentService.migrateLeadToCustomer(lead.id, customer.id);

    const updated =
      lead.status === "converted"
        ? lead
        : (await this.update(id, { status: "converted" }))!;

    if (!existingCustomer) {
      await activityService.create({
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

  async getByStatus(status: LeadStatus): Promise<Lead[]> {
    const rows = await prisma.leads.findMany({
      where: { status },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toLead);
  }

  async getByAssignee(userId: ID): Promise<Lead[]> {
    const rows = await prisma.leads.findMany({
      where: { assigned_to: userId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toLead);
  }

  async getBySource(source: LeadSource): Promise<Lead[]> {
    const rows = await prisma.leads.findMany({
      where: { source },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toLead);
  }

  async getByPriority(priority: LeadPriority): Promise<Lead[]> {
    const rows = await prisma.leads.findMany({
      where: { priority },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toLead);
  }

  async search(query: string): Promise<Lead[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();

    // Tags are a Postgres text[]; a substring match across joined tags can't be
    // expressed with Prisma's typed array filters, so we apply the original
    // case-insensitive substring predicate in-process to preserve behavior.
    const all = await this.getAll();
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
