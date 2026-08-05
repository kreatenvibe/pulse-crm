import { users } from "@/data/users";
import { DEFAULT_PAGE_SIZE, paginate } from "@/lib/pagination";
import type { ID, PaginatedResult, PaginationParams } from "@/types/common";
import type {
  ConvertLeadResult,
  LeadAssignee,
  LeadDetails,
} from "@/types/lead-details";
import type { Lead, LeadPriority, LeadSource, LeadStatus } from "@/types/lead";
import { leads } from "@/data/leads";
import { activities } from "@/data/activities";
import { appointments } from "@/data/appointments";
import { notes } from "@/data/notes";
import { tasks } from "@/data/tasks";
import { activityService } from "./activity.service";
import { appointmentService } from "./appointment.service";
import { customerService } from "./customer.service";
import { ServiceError } from "./errors";
import { nextId, now } from "./helpers";
import { noteService } from "./note.service";
import { taskService } from "./task.service";
import {
  assertEnum,
  assertOptionalString,
  assertRequiredString,
  assertTags,
  assertUserId,
  toOptionalDate,
} from "./validation";


export type CreateLeadInput = Omit<Lead, "id" | "createdAt" | "updatedAt">;
export type UpdateLeadInput = Partial<CreateLeadInput>;

const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "appointment_scheduled",
  "converted",
  "lost",
];

const LEAD_SOURCES: LeadSource[] = [
  "website",
  "whatsapp",
  "facebook",
  "instagram",
  "google",
  "referral",
  "walk_in",
  "phone",
];

const LEAD_PRIORITIES: LeadPriority[] = ["low", "medium", "high"];

function resolveAssignee(userId: ID): LeadAssignee {
  const user = users.find((entry) => entry.id === userId);
  return {
    id: userId,
    name: user?.name ?? userId,
  };
}

function validateCreateInput(data: CreateLeadInput): CreateLeadInput {
  return {
    name: assertRequiredString(data.name, "name"),
    email: assertOptionalString(data.email, "email"),
    phone: assertRequiredString(data.phone, "phone"),
    company: assertOptionalString(data.company, "company"),
    status: assertEnum(data.status, LEAD_STATUSES, "status"),
    source: assertEnum(data.source, LEAD_SOURCES, "source"),
    priority: assertEnum(data.priority, LEAD_PRIORITIES, "priority"),
    assignedTo: assertUserId(data.assignedTo),
    message: assertOptionalString(data.message, "message"),
    tags: assertTags(data.tags ?? []),
    lastContactedAt: toOptionalDate(data.lastContactedAt, "lastContactedAt"),
  };
}

function validateUpdateInput(data: UpdateLeadInput): UpdateLeadInput {
  const validated: UpdateLeadInput = {};

  if ("name" in data && data.name !== undefined) {
    validated.name = assertRequiredString(data.name, "name");
  }
  if ("email" in data) {
    validated.email = assertOptionalString(data.email, "email");
  }
  if ("phone" in data && data.phone !== undefined) {
    validated.phone = assertRequiredString(data.phone, "phone");
  }
  if ("company" in data) {
    validated.company = assertOptionalString(data.company, "company");
  }
  if ("status" in data && data.status !== undefined) {
    validated.status = assertEnum(data.status, LEAD_STATUSES, "status");
  }
  if ("source" in data && data.source !== undefined) {
    validated.source = assertEnum(data.source, LEAD_SOURCES, "source");
  }
  if ("priority" in data && data.priority !== undefined) {
    validated.priority = assertEnum(data.priority, LEAD_PRIORITIES, "priority");
  }
  if ("assignedTo" in data && data.assignedTo !== undefined) {
    validated.assignedTo = assertUserId(data.assignedTo);
  }
  if ("message" in data) {
    validated.message = assertOptionalString(data.message, "message");
  }
  if ("tags" in data && data.tags !== undefined) {
    validated.tags = assertTags(data.tags);
  }
  if ("lastContactedAt" in data) {
    validated.lastContactedAt = toOptionalDate(
      data.lastContactedAt,
      "lastContactedAt",
    );
  }

  return validated;
}

function getLeadDependencies(id: ID): string[] {
  const deps: string[] = [];

  if (tasks.some((task) => task.leadId === id)) deps.push("tasks");
  if (appointments.some((appt) => appt.leadId === id)) {
    deps.push("appointments");
  }
  if (notes.some((note) => note.entityType === "lead" && note.entityId === id)) {
    deps.push("notes");
  }
  if (
    activities.some(
      (activity) => activity.entityType === "lead" && activity.entityId === id,
    )
  ) {
    deps.push("activities");
  }

  return deps;
}

class LeadService {
  async getAll(): Promise<Lead[]> {
    return [...leads];
  }

  /**
   * Paginated list for `GET /api/leads?page=&pageSize=`.
   * Uses in-memory slicing today; same `{ data, pagination }` shape for future DB paging.
   */
  async list(
    params: Partial<PaginationParams> = {},
  ): Promise<PaginatedResult<Lead>> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
    return paginate(await this.getAll(), page, pageSize);
  }

  async getById(id: ID): Promise<Lead | null> {
    return leads.find((lead) => lead.id === id) ?? null;
  }

  async getDetails(id: ID): Promise<LeadDetails | null> {
    const lead = await this.getById(id);
    if (!lead) return null;

    const [activities, notes, tasks, appointments] = await Promise.all([
      activityService.getTimeline("lead", id),
      noteService.getForEntity("lead", id),
      taskService.getByLeadId(id),
      appointmentService.getByLeadId(id),
    ]);

    return {
      lead,
      assignedUser: resolveAssignee(lead.assignedTo),
      activities,
      notes,
      tasks,
      appointments,
    };
  }

  async create(data: CreateLeadInput): Promise<Lead> {
    const validated = validateCreateInput(data);
    const timestamp = now();
    const lead: Lead = {
      ...validated,
      id: nextId("lead", leads),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    leads.push(lead);
    return lead;
  }

  async update(id: ID, data: UpdateLeadInput): Promise<Lead | null> {
    const index = leads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;

    const previous = leads[index];
    const validated = validateUpdateInput(data);
    const updated: Lead = {
      ...previous,
      ...validated,
      id,
      updatedAt: now(),
    };
    leads[index] = updated;

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
    const index = leads.findIndex((lead) => lead.id === id);
    if (index === -1) return false;

    const customer = await customerService.getByLeadId(id);
    if (customer) {
      throw new ServiceError(
        "Cannot delete lead: a converted customer exists for this lead",
        "CONFLICT",
      );
    }

    const deps = getLeadDependencies(id);
    if (deps.length > 0) {
      throw new ServiceError(
        `Cannot delete lead: dependent ${deps.join(", ")} exist`,
        "CONFLICT",
      );
    }

    leads.splice(index, 1);
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
    return leads.filter((lead) => lead.status === status);
  }

  async getByAssignee(userId: ID): Promise<Lead[]> {
    return leads.filter((lead) => lead.assignedTo === userId);
  }

  async getBySource(source: LeadSource): Promise<Lead[]> {
    return leads.filter((lead) => lead.source === source);
  }

  async getByPriority(priority: LeadPriority): Promise<Lead[]> {
    return leads.filter((lead) => lead.priority === priority);
  }

  async search(query: string): Promise<Lead[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();

    return leads.filter((lead) => {
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
