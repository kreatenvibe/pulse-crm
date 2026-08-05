import { tasks } from "@/data/tasks";
import type { ID } from "@/types/common";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import { nextId, now } from "./helpers";
import {
  assertEnum,
  assertLeadCustomerXor,
  assertRequiredString,
  assertUserId,
  resolveLeadCustomerLink,
  toDate,
} from "./validation";

export type CreateTaskInput = Omit<Task, "id" | "createdAt" | "updatedAt">;
export type UpdateTaskInput = Partial<CreateTaskInput>;

const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high"];
const TASK_STATUSES: TaskStatus[] = [
  "todo",
  "in_progress",
  "done",
  "cancelled",
];

function validateCreateInput(data: CreateTaskInput): CreateTaskInput {
  const link = assertLeadCustomerXor(data.leadId, data.customerId);

  return {
    title: assertRequiredString(data.title, "title"),
    description: data.description,
    assignedTo: assertUserId(data.assignedTo),
    ...link,
    dueDate: toDate(data.dueDate, "dueDate"),
    priority: assertEnum(data.priority, TASK_PRIORITIES, "priority"),
    status: assertEnum(data.status, TASK_STATUSES, "status"),
  };
}

function validateUpdateInput(
  data: UpdateTaskInput,
  existing: Task,
): UpdateTaskInput {
  const validated: UpdateTaskInput = {};

  if ("title" in data && data.title !== undefined) {
    validated.title = assertRequiredString(data.title, "title");
  }
  if ("description" in data) {
    validated.description = data.description;
  }
  if ("assignedTo" in data && data.assignedTo !== undefined) {
    validated.assignedTo = assertUserId(data.assignedTo);
  }
  if (
    "leadId" in data ||
    "customerId" in data ||
    data.leadId !== undefined ||
    data.customerId !== undefined
  ) {
    validated.leadId = data.leadId;
    validated.customerId = data.customerId;
    const link = resolveLeadCustomerLink(validated, existing);
    validated.leadId = link.leadId;
    validated.customerId = link.customerId;
  }
  if ("dueDate" in data && data.dueDate !== undefined) {
    validated.dueDate = toDate(data.dueDate, "dueDate");
  }
  if ("priority" in data && data.priority !== undefined) {
    validated.priority = assertEnum(
      data.priority,
      TASK_PRIORITIES,
      "priority",
    );
  }
  if ("status" in data && data.status !== undefined) {
    validated.status = assertEnum(data.status, TASK_STATUSES, "status");
  }

  return validated;
}

class TaskService {
  async getAll(): Promise<Task[]> {
    return [...tasks];
  }

  async getById(id: ID): Promise<Task | null> {
    return tasks.find((task) => task.id === id) ?? null;
  }

  async create(data: CreateTaskInput): Promise<Task> {
    const validated = validateCreateInput(data);
    const timestamp = now();
    const task: Task = {
      ...validated,
      id: nextId("task", tasks),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    tasks.push(task);
    return task;
  }

  async update(id: ID, data: UpdateTaskInput): Promise<Task | null> {
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) return null;

    const validated = validateUpdateInput(data, tasks[index]);
    const updated: Task = {
      ...tasks[index],
      ...validated,
      id,
      updatedAt: now(),
    };
    tasks[index] = updated;
    return updated;
  }

  async delete(id: ID): Promise<boolean> {
    const index = tasks.findIndex((task) => task.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    return true;
  }

  async getByStatus(status: TaskStatus): Promise<Task[]> {
    return tasks.filter((task) => task.status === status);
  }

  async getByPriority(priority: TaskPriority): Promise<Task[]> {
    return tasks.filter((task) => task.priority === priority);
  }

  async getByAssignee(userId: ID): Promise<Task[]> {
    return tasks.filter((task) => task.assignedTo === userId);
  }

  async getByLeadId(leadId: ID): Promise<Task[]> {
    return tasks.filter((task) => task.leadId === leadId);
  }

  async getByCustomerId(customerId: ID): Promise<Task[]> {
    return tasks.filter((task) => task.customerId === customerId);
  }

  /** Reassign open lead tasks to a customer after conversion. */
  async migrateLeadToCustomer(leadId: ID, customerId: ID): Promise<number> {
    let count = 0;
    for (const task of tasks) {
      if (task.leadId === leadId) {
        task.leadId = undefined;
        task.customerId = customerId;
        task.updatedAt = now();
        count += 1;
      }
    }
    return count;
  }

  /** Open tasks past their due date. */
  async getOverdue(asOf: Date = now()): Promise<Task[]> {
    return tasks
      .filter(
        (task) =>
          task.dueDate < asOf &&
          task.status !== "done" &&
          task.status !== "cancelled",
      )
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  async getOpen(): Promise<Task[]> {
    return tasks.filter(
      (task) => task.status === "todo" || task.status === "in_progress",
    );
  }
}

export const taskService = new TaskService();
