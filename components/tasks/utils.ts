import type { CustomerDto } from "@/types/customer";
import type { LeadDto } from "@/types/lead";
import type { TaskDto, TaskPriority, TaskStatus } from "@/types/task";

// Single source of truth for domain vocabularies: lib/schemas/enums.ts.
export { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/schemas/enums";

export type TaskViewMode = "open" | "overdue" | "due_today" | "completed";

export type TaskLookups = {
  leadsById: Map<string, LeadDto>;
  customersById: Map<string, CustomerDto>;
};

export type EnrichedTask = TaskDto & {
  relatedLabel: string;
  relatedHref: string | null;
  relatedType: "lead" | "customer" | null;
};

export function buildTaskLookups(
  leads: LeadDto[],
  customers: CustomerDto[],
): TaskLookups {
  return {
    leadsById: new Map(leads.map((lead) => [lead.id, lead])),
    customersById: new Map(customers.map((customer) => [customer.id, customer])),
  };
}

export function enrichTask(
  task: TaskDto,
  lookups: TaskLookups,
): EnrichedTask {
  if (task.leadId) {
    const lead = lookups.leadsById.get(task.leadId);
    return {
      ...task,
      relatedType: "lead",
      relatedLabel: lead?.name ?? task.leadId,
      relatedHref: `/leads/${task.leadId}`,
    };
  }

  if (task.customerId) {
    const customer = lookups.customersById.get(task.customerId);
    const label =
      customer?.businessName?.trim() ||
      customer?.primaryContact ||
      task.customerId;
    return {
      ...task,
      relatedType: "customer",
      relatedLabel: label,
      relatedHref: `/customers/${task.customerId}`,
    };
  }

  return {
    ...task,
    relatedType: null,
    relatedLabel: "—",
    relatedHref: null,
  };
}

function isOpen(task: TaskDto): boolean {
  return task.status === "todo" || task.status === "in_progress";
}

function isOverdue(task: TaskDto, now: Date): boolean {
  return (
    new Date(task.dueDate) < now &&
    task.status !== "done" &&
    task.status !== "cancelled"
  );
}

function isDueToday(task: TaskDto, now: Date): boolean {
  const due = new Date(task.dueDate);
  return (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate() &&
    isOpen(task)
  );
}

function matchesView(
  task: TaskDto,
  viewMode: TaskViewMode,
  now: Date,
): boolean {
  switch (viewMode) {
    case "open":
      return isOpen(task);
    case "overdue":
      return isOverdue(task, now);
    case "due_today":
      return isDueToday(task, now);
    case "completed":
      return task.status === "done";
  }
}

export function countTasksByView(
  tasks: TaskDto[],
  now: Date = new Date(),
): Record<TaskViewMode, number> {
  return {
    open: tasks.filter((task) => isOpen(task)).length,
    overdue: tasks.filter((task) => isOverdue(task, now)).length,
    due_today: tasks.filter((task) => isDueToday(task, now)).length,
    completed: tasks.filter((task) => task.status === "done").length,
  };
}

export function filterTasks(
  tasks: TaskDto[],
  options: {
    viewMode: TaskViewMode;
    status: TaskStatus | "";
    priority: TaskPriority | "";
    now?: Date;
  },
): TaskDto[] {
  const now = options.now ?? new Date();

  const filtered = tasks.filter((task) => {
    if (!matchesView(task, options.viewMode, now)) return false;
    if (options.status && task.status !== options.status) return false;
    if (options.priority && task.priority !== options.priority) return false;
    return true;
  });

  return filtered.sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
}

export function emptyMessageForView(viewMode: TaskViewMode): string {
  switch (viewMode) {
    case "open":
      return "No open tasks match your filters.";
    case "overdue":
      return "No overdue tasks match your filters.";
    case "due_today":
      return "No tasks due today match your filters.";
    case "completed":
      return "No completed tasks match your filters.";
  }
}
