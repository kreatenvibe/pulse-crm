import { tasks } from "@/data/tasks";
import type { ID } from "@/types/common";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import { nextId, now } from "./helpers";

export type CreateTaskInput = Omit<Task, "id" | "createdAt" | "updatedAt">;
export type UpdateTaskInput = Partial<CreateTaskInput>;

class TaskService {
  async getAll(): Promise<Task[]> {
    return [...tasks];
  }

  async getById(id: ID): Promise<Task | null> {
    return tasks.find((task) => task.id === id) ?? null;
  }

  async create(data: CreateTaskInput): Promise<Task> {
    const timestamp = now();
    const task: Task = {
      ...data,
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

    const updated: Task = {
      ...tasks[index],
      ...data,
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
