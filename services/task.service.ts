import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import type { tasks as TaskRow } from "@/lib/generated/prisma/client";
import type { ID } from "@/types/common";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/lib/schemas/task.schema";
import { nextId, now } from "./helpers";
import { parseInput } from "./parse";
import {
  assertLeadCustomerXor,
  assertUserId,
  resolveLeadCustomerLink,
} from "./validation";

export type { CreateTaskInput, UpdateTaskInput };

/** Stable order: zero-padded ids sort identically to the original /data array. */
const ORDER_BY_ID = { id: "asc" } as const;

/** Map a Prisma `tasks` row (snake_case, nullable) to the domain `Task`. */
function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    assignedTo: row.assigned_to,
    leadId: row.lead_id ?? undefined,
    customerId: row.customer_id ?? undefined,
    dueDate: row.due_date,
    priority: row.priority as TaskPriority,
    status: row.status as TaskStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Translate a validated partial update into a Prisma column patch. */
function toUpdatePatch(
  validated: UpdateTaskInput,
): Prisma.tasksUncheckedUpdateInput {
  const patch: Prisma.tasksUncheckedUpdateInput = { updated_at: now() };

  if ("title" in validated) patch.title = validated.title;
  if ("description" in validated) patch.description = validated.description ?? null;
  if ("assignedTo" in validated) patch.assigned_to = validated.assignedTo;
  // The link block always resolves both leadId and customerId together (exactly
  // one is set, the other undefined), so mirror that by writing both columns.
  if ("leadId" in validated || "customerId" in validated) {
    patch.lead_id = validated.leadId ?? null;
    patch.customer_id = validated.customerId ?? null;
  }
  if ("dueDate" in validated) patch.due_date = validated.dueDate;
  if ("priority" in validated) patch.priority = validated.priority;
  if ("status" in validated) patch.status = validated.status;

  return patch;
}

class TaskService {
  async getAll(): Promise<Task[]> {
    const rows = await prisma.tasks.findMany({ orderBy: ORDER_BY_ID });
    return rows.map(toTask);
  }

  async getById(id: ID): Promise<Task | null> {
    const row = await prisma.tasks.findUnique({ where: { id } });
    return row ? toTask(row) : null;
  }

  async create(data: CreateTaskInput): Promise<Task> {
    const input = parseInput(CreateTaskSchema, data);
    // Exactly-one-of + existence for leadId/customerId (DB-backed).
    const link = await assertLeadCustomerXor(input.leadId, input.customerId);
    const assignedTo = await assertUserId(input.assignedTo);
    const timestamp = now();

    const existing = await prisma.tasks.findMany({ select: { id: true } });
    const id = nextId("task", existing);

    const row = await prisma.tasks.create({
      data: {
        id,
        title: input.title,
        description: input.description ?? null,
        assigned_to: assignedTo,
        lead_id: link.leadId ?? null,
        customer_id: link.customerId ?? null,
        due_date: input.dueDate,
        priority: input.priority,
        status: input.status,
        created_at: timestamp,
        updated_at: timestamp,
      },
    });

    return toTask(row);
  }

  async update(id: ID, data: UpdateTaskInput): Promise<Task | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const validated = parseInput(UpdateTaskSchema, data);
    if (validated.assignedTo !== undefined) {
      validated.assignedTo = await assertUserId(validated.assignedTo);
    }
    // Re-resolve the lead/customer link (shape + existence, with the existing
    // record as fallback) whenever either side is referenced in the patch.
    if (
      "leadId" in validated ||
      "customerId" in validated ||
      validated.leadId !== undefined ||
      validated.customerId !== undefined
    ) {
      const link = await resolveLeadCustomerLink(
        { leadId: validated.leadId, customerId: validated.customerId },
        existing,
      );
      validated.leadId = link.leadId;
      validated.customerId = link.customerId;
    }
    const row = await prisma.tasks.update({
      where: { id },
      data: toUpdatePatch(validated),
    });
    return toTask(row);
  }

  async delete(id: ID): Promise<boolean> {
    const existing = await prisma.tasks.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) return false;

    await prisma.tasks.delete({ where: { id } });
    return true;
  }

  async getByStatus(status: TaskStatus): Promise<Task[]> {
    const rows = await prisma.tasks.findMany({
      where: { status },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toTask);
  }

  async getByPriority(priority: TaskPriority): Promise<Task[]> {
    const rows = await prisma.tasks.findMany({
      where: { priority },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toTask);
  }

  async getByAssignee(userId: ID): Promise<Task[]> {
    const rows = await prisma.tasks.findMany({
      where: { assigned_to: userId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toTask);
  }

  async getByLeadId(leadId: ID): Promise<Task[]> {
    const rows = await prisma.tasks.findMany({
      where: { lead_id: leadId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toTask);
  }

  async getByCustomerId(customerId: ID): Promise<Task[]> {
    const rows = await prisma.tasks.findMany({
      where: { customer_id: customerId },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toTask);
  }

  /** Reassign open lead tasks to a customer after conversion. */
  async migrateLeadToCustomer(leadId: ID, customerId: ID): Promise<number> {
    const result = await prisma.tasks.updateMany({
      where: { lead_id: leadId },
      data: { lead_id: null, customer_id: customerId, updated_at: now() },
    });
    return result.count;
  }

  /** Open tasks past their due date. */
  async getOverdue(asOf: Date = now()): Promise<Task[]> {
    const rows = await prisma.tasks.findMany({
      where: {
        due_date: { lt: asOf },
        status: { notIn: ["done", "cancelled"] },
      },
      orderBy: { due_date: "asc" },
    });
    return rows.map(toTask);
  }

  async getOpen(): Promise<Task[]> {
    const rows = await prisma.tasks.findMany({
      where: { status: { in: ["todo", "in_progress"] } },
      orderBy: ORDER_BY_ID,
    });
    return rows.map(toTask);
  }
}

export const taskService = new TaskService();
