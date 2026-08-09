import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { services as ServiceRow } from "@/lib/generated/prisma/client";
import type { ID } from "@/types/common";
import type { Service, ServiceStatus } from "@/types/service";
import {
  CreateServiceSchema,
  UpdateServiceSchema,
  type CreateServiceInput,
  type UpdateServiceInput,
} from "@/lib/schemas/service.schema";
import { nextId, now } from "./helpers";
import { assertCustomerId, parseInput } from "./validation";

export type { CreateServiceInput, UpdateServiceInput };

/** Stable order: zero-padded ids sort identically to the original /data array. */
const ORDER_BY_ID = { id: "asc" } as const;

/** Map a Prisma `services` row (snake_case, nullable) to the domain `Service`. */
function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    customerId: row.customer_id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status as ServiceStatus,
    scheduledDate: row.scheduled_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Translate a validated partial update into a Prisma column patch. */
function toUpdatePatch(
  validated: UpdateServiceInput,
): Prisma.servicesUncheckedUpdateInput {
  const patch: Prisma.servicesUncheckedUpdateInput = { updated_at: now() };

  if ("customerId" in validated) patch.customer_id = validated.customerId;
  if ("title" in validated) patch.title = validated.title;
  if ("description" in validated) {
    patch.description = validated.description ?? null;
  }
  if ("status" in validated) patch.status = validated.status;
  if ("scheduledDate" in validated) {
    patch.scheduled_date = validated.scheduledDate ?? null;
  }

  return patch;
}

class ServiceService {
  async getAll(): Promise<Service[]> {
    const rows = await prisma.services.findMany({ orderBy: ORDER_BY_ID });
    return rows.map(toService);
  }

  async getById(id: ID): Promise<Service | null> {
    const row = await prisma.services.findUnique({ where: { id } });
    return row ? toService(row) : null;
  }

  async create(data: CreateServiceInput): Promise<Service> {
    const input = parseInput(CreateServiceSchema, data);
    const customerId = await assertCustomerId(input.customerId);
    const timestamp = now();

    const existing = await prisma.services.findMany({ select: { id: true } });
    const id = nextId("svc", existing);

    const row = await prisma.services.create({
      data: {
        id,
        customer_id: customerId,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        scheduled_date: input.scheduledDate ?? null,
        created_at: timestamp,
        updated_at: timestamp,
      },
    });

    return toService(row);
  }

  async update(id: ID, data: UpdateServiceInput): Promise<Service | null> {
    const previous = await this.getById(id);
    if (!previous) return null;

    const validated = parseInput(UpdateServiceSchema, data);
    if (validated.customerId !== undefined) {
      validated.customerId = await assertCustomerId(validated.customerId);
    }
    const row = await prisma.services.update({
      where: { id },
      data: toUpdatePatch(validated),
    });

    return toService(row);
  }

  async delete(id: ID): Promise<boolean> {
    const existing = await prisma.services.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return false;

    await prisma.services.delete({ where: { id } });
    return true;
  }

  async getByCustomerId(customerId: ID): Promise<Service[]> {
    const rows = await prisma.services.findMany({
      where: { customer_id: customerId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toService);
  }

  async getByStatus(status: ServiceStatus): Promise<Service[]> {
    const rows = await prisma.services.findMany({
      where: { status },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toService);
  }

  async getActive(): Promise<Service[]> {
    const rows = await prisma.services.findMany({
      where: { status: { in: ["planned", "in_progress"] } },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toService);
  }
}

export const serviceService = new ServiceService();
