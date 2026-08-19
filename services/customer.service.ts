import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { customers as CustomerRow } from "@/lib/generated/prisma/client";
import type { ID } from "@/types/common";
import type {
  CustomerAssignee,
  CustomerDetails,
  CustomerSourceLead,
} from "@/types/customer-details";
import type { Customer, CustomerLifecycleStatus } from "@/types/customer";
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from "@/lib/schemas/customer.schema";
import { activityService } from "./activity.service";
import { appointmentService } from "./appointment.service";
import { conflict } from "./errors";
import { invoiceService } from "./invoice.service";
import { nextId, now } from "./helpers";
import { noteService } from "./note.service";
import { serviceService } from "./service.service";
import { taskService } from "./task.service";
import { parseInput } from "./parse";
import { assertLeadId, assertUserId } from "./validation";

export type { CreateCustomerInput, UpdateCustomerInput };

/** Stable order: zero-padded ids sort identically to the original /data array. */
const ORDER_BY_ID = { id: "asc" } as const;

/** Map a Prisma `customers` row (snake_case, nullable) to the domain `Customer`. */
function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    leadId: row.lead_id,
    businessName: row.business_name ?? undefined,
    primaryContact: row.primary_contact,
    phone: row.phone,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    assignedTo: row.assigned_to,
    lifecycleStatus: row.lifecycle_status as CustomerLifecycleStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function resolveAssignee(userId: ID): Promise<CustomerAssignee> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return {
    id: userId,
    name: user?.name ?? userId,
  };
}

async function resolveSourceLead(leadId: ID): Promise<CustomerSourceLead> {
  const lead = await prisma.leads.findUnique({
    where: { id: leadId },
    select: { name: true },
  });
  return {
    id: leadId,
    name: lead?.name ?? leadId,
  };
}

/** Translate a validated partial update into a Prisma column patch. */
function toUpdatePatch(
  validated: UpdateCustomerInput,
): Prisma.customersUncheckedUpdateInput {
  const patch: Prisma.customersUncheckedUpdateInput = { updated_at: now() };

  if ("leadId" in validated) patch.lead_id = validated.leadId;
  if ("businessName" in validated) {
    patch.business_name = validated.businessName ?? null;
  }
  if ("primaryContact" in validated) {
    patch.primary_contact = validated.primaryContact;
  }
  if ("phone" in validated) patch.phone = validated.phone;
  if ("email" in validated) patch.email = validated.email ?? null;
  if ("address" in validated) patch.address = validated.address ?? null;
  if ("assignedTo" in validated) patch.assigned_to = validated.assignedTo;
  if ("lifecycleStatus" in validated) {
    patch.lifecycle_status = validated.lifecycleStatus;
  }

  return patch;
}

/**
 * Names of tables that still reference this customer, in a stable report
 * order. Scoped defensively by `organizationId` even though `id` is already
 * proven org-owned by every caller (matches `lead.service.ts`'s
 * `getLeadDependencies`, plan.md §9).
 */
async function getCustomerDependencies(organizationId: ID, id: ID): Promise<string[]> {
  const deps: string[] = [];

  const [taskCount, apptCount, serviceCount, invoiceCount, noteCount, activityCount] =
    await Promise.all([
      prisma.tasks.count({ where: { customer_id: id, organization_id: organizationId } }),
      prisma.appointments.count({ where: { customer_id: id, organization_id: organizationId } }),
      prisma.services.count({ where: { customer_id: id, organization_id: organizationId } }),
      prisma.invoices.count({ where: { customer_id: id, organization_id: organizationId } }),
      prisma.notes.count({
        where: { entity_type: "customer", entity_id: id, organization_id: organizationId },
      }),
      prisma.activities.count({
        where: { entity_type: "customer", entity_id: id, organization_id: organizationId },
      }),
    ]);

  if (taskCount > 0) deps.push("tasks");
  if (apptCount > 0) deps.push("appointments");
  if (serviceCount > 0) deps.push("services");
  if (invoiceCount > 0) deps.push("invoices");
  if (noteCount > 0) deps.push("notes");
  if (activityCount > 0) deps.push("activities");

  return deps;
}

class CustomerService {
  async getAll(organizationId: ID): Promise<Customer[]> {
    const rows = await prisma.customers.findMany({
      where: { organization_id: organizationId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toCustomer);
  }

  async getById(organizationId: ID, id: ID): Promise<Customer | null> {
    const row = await prisma.customers.findFirst({
      where: { id, organization_id: organizationId },
    });
    return row ? toCustomer(row) : null;
  }

  async getDetails(organizationId: ID, id: ID): Promise<CustomerDetails | null> {
    const customer = await this.getById(organizationId, id);
    if (!customer) return null;

    const [
      assignedUser,
      sourceLead,
      activities,
      notes,
      appointments,
      services,
      invoices,
      tasks,
    ] = await Promise.all([
      resolveAssignee(customer.assignedTo),
      resolveSourceLead(customer.leadId),
      activityService.getTimeline(organizationId, "customer", id),
      noteService.getForEntity(organizationId, "customer", id),
      appointmentService.getByCustomerId(organizationId, id),
      serviceService.getByCustomerId(organizationId, id),
      invoiceService.getByCustomerId(organizationId, id),
      taskService.getByCustomerId(organizationId, id),
    ]);

    return {
      customer,
      assignedUser,
      sourceLead,
      activities,
      notes,
      appointments,
      services,
      invoices,
      tasks,
    };
  }

  async create(organizationId: ID, data: CreateCustomerInput): Promise<Customer> {
    const input = parseInput(CreateCustomerSchema, data);
    const leadId = await assertLeadId(organizationId, input.leadId);
    const assignedTo = await assertUserId(organizationId, input.assignedTo);
    const timestamp = now();

    // Deliberately NOT filtered by organizationId — `id` is a global primary
    // key (see lead.service.ts's `create` for the full rationale).
    const existing = await prisma.customers.findMany({ select: { id: true } });
    const id = nextId("cust", existing);

    const row = await prisma.customers.create({
      data: {
        id,
        organization_id: organizationId,
        lead_id: leadId,
        business_name: input.businessName ?? null,
        primary_contact: input.primaryContact,
        phone: input.phone,
        email: input.email ?? null,
        address: input.address ?? null,
        assigned_to: assignedTo,
        lifecycle_status: input.lifecycleStatus,
        created_at: timestamp,
        updated_at: timestamp,
      },
    });

    return toCustomer(row);
  }

  async update(organizationId: ID, id: ID, data: UpdateCustomerInput): Promise<Customer | null> {
    const previous = await this.getById(organizationId, id);
    if (!previous) return null;

    const validated = parseInput(UpdateCustomerSchema, data);
    if (validated.leadId !== undefined) {
      validated.leadId = await assertLeadId(organizationId, validated.leadId);
    }
    if (validated.assignedTo !== undefined) {
      validated.assignedTo = await assertUserId(organizationId, validated.assignedTo);
    }
    const row = await prisma.customers.update({
      where: { id },
      data: toUpdatePatch(validated),
    });
    return toCustomer(row);
  }

  async delete(organizationId: ID, id: ID): Promise<boolean> {
    const existing = await prisma.customers.findFirst({
      where: { id, organization_id: organizationId },
      select: { id: true },
    });
    if (!existing) return false;

    const deps = await getCustomerDependencies(organizationId, id);
    if (deps.length > 0) {
      throw conflict(
        `Cannot delete customer: dependent ${deps.join(", ")} exist`,
      );
    }

    await prisma.customers.delete({ where: { id } });
    return true;
  }

  async getByLeadId(organizationId: ID, leadId: ID): Promise<Customer | null> {
    const row = await prisma.customers.findFirst({
      where: { lead_id: leadId, organization_id: organizationId },
    });
    return row ? toCustomer(row) : null;
  }

  async getByLifecycle(
    organizationId: ID,
    status: CustomerLifecycleStatus,
  ): Promise<Customer[]> {
    const rows = await prisma.customers.findMany({
      where: { organization_id: organizationId, lifecycle_status: status },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toCustomer);
  }

  async getActive(organizationId: ID): Promise<Customer[]> {
    const rows = await prisma.customers.findMany({
      where: {
        organization_id: organizationId,
        lifecycle_status: { in: ["active", "onboarding"] },
      },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toCustomer);
  }

  async getByAssignee(organizationId: ID, userId: ID): Promise<Customer[]> {
    const rows = await prisma.customers.findMany({
      where: { organization_id: organizationId, assigned_to: userId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toCustomer);
  }

  async search(organizationId: ID, query: string): Promise<Customer[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll(organizationId);

    // Preserve the original case-insensitive substring match across the joined
    // customer fields by applying it in-process, mirroring leadService.search.
    const all = await this.getAll(organizationId);
    return all.filter((customer) => {
      const haystack = [
        customer.primaryContact,
        customer.businessName,
        customer.email,
        customer.phone,
        customer.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }
}

export const customerService = new CustomerService();
