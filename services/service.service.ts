import { services } from "@/data/services";
import type { ID } from "@/types/common";
import type { Service, ServiceStatus } from "@/types/service";
import { nextId, now } from "./helpers";
import {
  assertCustomerId,
  assertEnum,
  assertOptionalString,
  assertRequiredString,
  toOptionalDate,
} from "./validation";

export type CreateServiceInput = Omit<
  Service,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateServiceInput = Partial<CreateServiceInput>;

const SERVICE_STATUSES: ServiceStatus[] = [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
];

function validateCreateInput(data: CreateServiceInput): CreateServiceInput {
  return {
    customerId: assertCustomerId(data.customerId),
    title: assertRequiredString(data.title, "title"),
    description: assertOptionalString(data.description, "description"),
    status: assertEnum(data.status, SERVICE_STATUSES, "status"),
    scheduledDate: toOptionalDate(data.scheduledDate, "scheduledDate"),
  };
}

function validateUpdateInput(data: UpdateServiceInput): UpdateServiceInput {
  const validated: UpdateServiceInput = {};

  if ("customerId" in data && data.customerId !== undefined) {
    validated.customerId = assertCustomerId(data.customerId);
  }
  if ("title" in data && data.title !== undefined) {
    validated.title = assertRequiredString(data.title, "title");
  }
  if ("description" in data) {
    validated.description = assertOptionalString(
      data.description,
      "description",
    );
  }
  if ("status" in data && data.status !== undefined) {
    validated.status = assertEnum(data.status, SERVICE_STATUSES, "status");
  }
  if ("scheduledDate" in data) {
    validated.scheduledDate = toOptionalDate(
      data.scheduledDate,
      "scheduledDate",
    );
  }

  return validated;
}

class ServiceService {
  async getAll(): Promise<Service[]> {
    return [...services];
  }

  async getById(id: ID): Promise<Service | null> {
    return services.find((service) => service.id === id) ?? null;
  }

  async create(data: CreateServiceInput): Promise<Service> {
    const validated = validateCreateInput(data);
    const timestamp = now();
    const service: Service = {
      ...validated,
      id: nextId("svc", services),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    services.push(service);
    return service;
  }

  async update(id: ID, data: UpdateServiceInput): Promise<Service | null> {
    const index = services.findIndex((service) => service.id === id);
    if (index === -1) return null;

    const validated = validateUpdateInput(data);
    const updated: Service = {
      ...services[index],
      ...validated,
      id,
      updatedAt: now(),
    };
    services[index] = updated;
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const index = services.findIndex((service) => service.id === id);
    if (index === -1) return false;
    services.splice(index, 1);
    return true;
  }

  async getByCustomerId(customerId: ID): Promise<Service[]> {
    return services.filter((service) => service.customerId === customerId);
  }

  async getByStatus(status: ServiceStatus): Promise<Service[]> {
    return services.filter((service) => service.status === status);
  }

  async getActive(): Promise<Service[]> {
    return services.filter(
      (service) =>
        service.status === "planned" || service.status === "in_progress",
    );
  }
}

export const serviceService = new ServiceService();
