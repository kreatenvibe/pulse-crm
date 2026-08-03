import { BaseEntity, ID, type WithIsoDates } from "./common";

export type TaskPriority = "low" | "medium" | "high";

export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";

export interface Task extends BaseEntity {
  title: string;
  description?: string;

  assignedTo: ID;
  // TODO: XOR — exactly one of leadId or customerId must be present (enforce at DB/API later).
  leadId?: ID;
  customerId?: ID;

  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;
}

/** Task as returned by API JSON (dates are ISO strings). */
export type TaskDto = WithIsoDates<Task>;
