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

/** Names of tables that still reference this customer, in a stable report order. */
async function getCustomerDependencies(id: ID): Promise<string[]> {
  const deps: string[] = [];

  const [taskCount, apptCount, serviceCount, invoiceCount, noteCount, activityCount] =
    await Promise.all([
      prisma.tasks.count({ where: { customer_id: id } }),
      prisma.appointments.count({ where: { customer_id: id } }),
      prisma.services.count({ where: { customer_id: id } }),
      prisma.invoices.count({ where: { customer_id: id } }),
      prisma.notes.count({ where: { entity_type: "customer", entity_id: id } }),
      prisma.activities.count({
        where: { entity_type: "customer", entity_id: id },
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
  async getAll(): Promise<Customer[]> {
    const rows = await prisma.customers.findMany({ orderBy: ORDER_BY_ID });
    return rows.map(toCustomer);
  }

  async getById(id: ID): Promise<Customer | null> {
    const row = await prisma.customers.findUnique({ where: { id } });
    return row ? toCustomer(row) : null;
  }

  async getDetails(id: ID): Promise<CustomerDetails | null> {
    const customer = await this.getById(id);
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
      activityService.getTimeline("customer", id),
      noteService.getForEntity("customer", id),
      appointmentService.getByCustomerId(id),
      serviceService.getByCustomerId(id),
      invoiceService.getByCustomerId(id),
      taskService.getByCustomerId(id),
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

  async create(data: CreateCustomerInput): Promise<Customer> {
    const input = parseInput(CreateCustomerSchema, data);
    const leadId = await assertLeadId(input.leadId);
    const assignedTo = await assertUserId(input.assignedTo);
    const timestamp = now();

    const existing = await prisma.customers.findMany({ select: { id: true } });
    const id = nextId("cust", existing);

    const row = await prisma.customers.create({
      data: {
        id,
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

  async update(id: ID, data: UpdateCustomerInput): Promise<Customer | null> {
    const previous = await this.getById(id);
    if (!previous) return null;

    const validated = parseInput(UpdateCustomerSchema, data);
    if (validated.leadId !== undefined) {
      validated.leadId = await assertLeadId(validated.leadId);
    }
    if (validated.assignedTo !== undefined) {
      validated.assignedTo = await assertUserId(validated.assignedTo);
    }
    const row = await prisma.customers.update({
      where: { id },
      data: toUpdatePatch(validated),
    });
    return toCustomer(row);
  }

  async delete(id: ID): Promise<boolean> {
    const existing = await prisma.customers.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return false;

    const deps = await getCustomerDependencies(id);
    if (deps.length > 0) {
      throw conflict(
        `Cannot delete customer: dependent ${deps.join(", ")} exist`,
      );
    }

    await prisma.customers.delete({ where: { id } });
    return true;
  }

  async getByLeadId(leadId: ID): Promise<Customer | null> {
    const row = await prisma.customers.findUnique({ where: { lead_id: leadId } });
    return row ? toCustomer(row) : null;
  }

  async getByLifecycle(
    status: CustomerLifecycleStatus,
  ): Promise<Customer[]> {
    const rows = await prisma.customers.findMany({
      where: { lifecycle_status: status },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toCustomer);
  }

  async getActive(): Promise<Customer[]> {
    const rows = await prisma.customers.findMany({
      where: { lifecycle_status: { in: ["active", "onboarding"] } },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toCustomer);
  }

  async getByAssignee(userId: ID): Promise<Customer[]> {
    const rows = await prisma.customers.findMany({
      where: { assigned_to: userId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toCustomer);
  }

  async search(query: string): Promise<Customer[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();

    // Preserve the original case-insensitive substring match across the joined
    // customer fields by applying it in-process, mirroring leadService.search.
    const all = await this.getAll();
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
