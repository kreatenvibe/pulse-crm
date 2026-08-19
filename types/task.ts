import { BaseEntity, ID, type WithIsoDates } from "./common";
import type { TaskPriority, TaskStatus } from "@/lib/schemas/enums";

// Source of truth: lib/schemas/enums.ts.
export type { TaskPriority, TaskStatus };

export interface Task extends BaseEntity {
  title: string;
  description?: string;

  assignedTo: ID;
  leadId?: ID;
  customerId?: ID;

  dueDate: Date;
  priority: TaskPriority;
  status: TaskStatus;

  /** Optional until Milestone 5/6 thread org scoping through the service layer. */
  organizationId?: ID;
}

/** Task as returned by API JSON (dates are ISO strings). */
export type TaskDto = WithIsoDates<Task>;
