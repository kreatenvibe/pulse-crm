import { services } from "@/data/services";
import type { ID } from "@/types/common";
import type { Service, ServiceStatus } from "@/types/service";
import { nextId, now } from "./helpers";

export type CreateServiceInput = Omit<
  Service,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateServiceInput = Partial<CreateServiceInput>;

class ServiceService {
  async getAll(): Promise<Service[]> {
    return [...services];
  }

  async getById(id: ID): Promise<Service | null> {
    return services.find((service) => service.id === id) ?? null;
  }

  async create(data: CreateServiceInput): Promise<Service> {
    const timestamp = now();
    const service: Service = {
      ...data,
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

    const updated: Service = {
      ...services[index],
      ...data,
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
