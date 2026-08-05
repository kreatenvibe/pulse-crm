import { customers } from "@/data/customers";
import { leads } from "@/data/leads";
import { users } from "@/data/users";
import { activities } from "@/data/activities";
import { appointments } from "@/data/appointments";
import { invoices } from "@/data/invoices";
import { notes } from "@/data/notes";
import { services } from "@/data/services";
import { tasks } from "@/data/tasks";
import type { ID } from "@/types/common";
import type {
  CustomerAssignee,
  CustomerDetails,
  CustomerSourceLead,
} from "@/types/customer-details";
import type { Customer, CustomerLifecycleStatus } from "@/types/customer";
import { activityService } from "./activity.service";
import { appointmentService } from "./appointment.service";
import { ServiceError } from "./errors";
import { invoiceService } from "./invoice.service";
import { nextId, now } from "./helpers";
import { noteService } from "./note.service";
import { serviceService } from "./service.service";
import { taskService } from "./task.service";
import {
  assertEnum,
  assertLeadId,
  assertOptionalString,
  assertRequiredString,
  assertUserId,
} from "./validation";

export type CreateCustomerInput = Omit<
  Customer,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateCustomerInput = Partial<CreateCustomerInput>;

const LIFECYCLE_STATUSES: CustomerLifecycleStatus[] = [
  "onboarding",
  "active",
  "inactive",
  "churned",
];

function resolveAssignee(userId: ID): CustomerAssignee {
  const user = users.find((entry) => entry.id === userId);
  return {
    id: userId,
    name: user?.name ?? userId,
  };
}

function resolveSourceLead(leadId: ID): CustomerSourceLead {
  const lead = leads.find((entry) => entry.id === leadId);
  return {
    id: leadId,
    name: lead?.name ?? leadId,
  };
}

function validateCreateInput(data: CreateCustomerInput): CreateCustomerInput {
  return {
    leadId: assertLeadId(data.leadId),
    businessName: assertOptionalString(data.businessName, "businessName"),
    primaryContact: assertRequiredString(data.primaryContact, "primaryContact"),
    phone: assertRequiredString(data.phone, "phone"),
    email: assertOptionalString(data.email, "email"),
    address: assertOptionalString(data.address, "address"),
    assignedTo: assertUserId(data.assignedTo),
    lifecycleStatus: assertEnum(
      data.lifecycleStatus,
      LIFECYCLE_STATUSES,
      "lifecycleStatus",
    ),
  };
}

function validateUpdateInput(data: UpdateCustomerInput): UpdateCustomerInput {
  const validated: UpdateCustomerInput = {};

  if ("leadId" in data && data.leadId !== undefined) {
    validated.leadId = assertLeadId(data.leadId);
  }
  if ("businessName" in data) {
    validated.businessName = assertOptionalString(
      data.businessName,
      "businessName",
    );
  }
  if ("primaryContact" in data && data.primaryContact !== undefined) {
    validated.primaryContact = assertRequiredString(
      data.primaryContact,
      "primaryContact",
    );
  }
  if ("phone" in data && data.phone !== undefined) {
    validated.phone = assertRequiredString(data.phone, "phone");
  }
  if ("email" in data) {
    validated.email = assertOptionalString(data.email, "email");
  }
  if ("address" in data) {
    validated.address = assertOptionalString(data.address, "address");
  }
  if ("assignedTo" in data && data.assignedTo !== undefined) {
    validated.assignedTo = assertUserId(data.assignedTo);
  }
  if ("lifecycleStatus" in data && data.lifecycleStatus !== undefined) {
    validated.lifecycleStatus = assertEnum(
      data.lifecycleStatus,
      LIFECYCLE_STATUSES,
      "lifecycleStatus",
    );
  }

  return validated;
}

function getCustomerDependencies(id: ID): string[] {
  const deps: string[] = [];

  if (tasks.some((task) => task.customerId === id)) deps.push("tasks");
  if (appointments.some((appt) => appt.customerId === id)) {
    deps.push("appointments");
  }
  if (services.some((service) => service.customerId === id)) {
    deps.push("services");
  }
  if (invoices.some((invoice) => invoice.customerId === id)) {
    deps.push("invoices");
  }
  if (
    notes.some(
      (note) => note.entityType === "customer" && note.entityId === id,
    )
  ) {
    deps.push("notes");
  }
  if (
    activities.some(
      (activity) =>
        activity.entityType === "customer" && activity.entityId === id,
    )
  ) {
    deps.push("activities");
  }

  return deps;
}

class CustomerService {
  async getAll(): Promise<Customer[]> {
    return [...customers];
  }

  async getById(id: ID): Promise<Customer | null> {
    return customers.find((customer) => customer.id === id) ?? null;
  }

  async getDetails(id: ID): Promise<CustomerDetails | null> {
    const customer = await this.getById(id);
    if (!customer) return null;

    const [activities, notes, appointments, services, invoices, tasks] =
      await Promise.all([
        activityService.getTimeline("customer", id),
        noteService.getForEntity("customer", id),
        appointmentService.getByCustomerId(id),
        serviceService.getByCustomerId(id),
        invoiceService.getByCustomerId(id),
        taskService.getByCustomerId(id),
      ]);

    return {
      customer,
      assignedUser: resolveAssignee(customer.assignedTo),
      sourceLead: resolveSourceLead(customer.leadId),
      activities,
      notes,
      appointments,
      services,
      invoices,
      tasks,
    };
  }

  async create(data: CreateCustomerInput): Promise<Customer> {
    const validated = validateCreateInput(data);
    const timestamp = now();
    const customer: Customer = {
      ...validated,
      id: nextId("cust", customers),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    customers.push(customer);
    return customer;
  }

  async update(id: ID, data: UpdateCustomerInput): Promise<Customer | null> {
    const index = customers.findIndex((customer) => customer.id === id);
    if (index === -1) return null;

    const validated = validateUpdateInput(data);
    const updated: Customer = {
      ...customers[index],
      ...validated,
      id,
      updatedAt: now(),
    };
    customers[index] = updated;
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const index = customers.findIndex((customer) => customer.id === id);
    if (index === -1) return false;

    const deps = getCustomerDependencies(id);
    if (deps.length > 0) {
      throw new ServiceError(
        `Cannot delete customer: dependent ${deps.join(", ")} exist`,
        "CONFLICT",
      );
    }

    customers.splice(index, 1);
    return true;
  }

  async getByLeadId(leadId: ID): Promise<Customer | null> {
    return customers.find((customer) => customer.leadId === leadId) ?? null;
  }

  async getByLifecycle(
    status: CustomerLifecycleStatus,
  ): Promise<Customer[]> {
    return customers.filter((customer) => customer.lifecycleStatus === status);
  }

  async getActive(): Promise<Customer[]> {
    return customers.filter(
      (customer) =>
        customer.lifecycleStatus === "active" ||
        customer.lifecycleStatus === "onboarding",
    );
  }

  async getByAssignee(userId: ID): Promise<Customer[]> {
    return customers.filter((customer) => customer.assignedTo === userId);
  }

  async search(query: string): Promise<Customer[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();

    return customers.filter((customer) => {
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
