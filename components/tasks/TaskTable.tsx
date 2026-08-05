"use client";

import Link from "next/link";
import {
  DataTable,
  EmptyState,
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/ui";
import { formatDate, formatLabel } from "@/lib/format";
import type { TaskPriority, TaskStatus } from "@/types/task";
import type { EnrichedTask } from "./utils";

type TaskTableProps = {
  tasks: EnrichedTask[];
  emptyMessage?: string;
};

const STATUS_TONE: Record<TaskStatus, StatusBadgeTone> = {
  todo: "info",
  in_progress: "brand",
  done: "success",
  cancelled: "neutral",
};

const PRIORITY_TONE: Record<TaskPriority, StatusBadgeTone> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export function TaskTable({
  tasks,
  emptyMessage = "No tasks found.",
}: TaskTableProps) {
  if (tasks.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <DataTable
      data={tasks}
      getRowId={(task) => task.id}
      columns={[
        {
          id: "title",
          header: "Title",
          cell: (task) => (
            <span
              className="block max-w-64 truncate font-medium text-foreground"
              title={task.title}
            >
              {task.title}
            </span>
          ),
        },
        {
          id: "related",
          header: "Related",
          muted: true,
          cell: (task) =>
            task.relatedHref ? (
              <Link
                href={task.relatedHref}
                className="text-brand hover:text-brand-hover hover:underline"
              >
                {task.relatedType === "lead" ? "Lead: " : "Customer: "}
                {task.relatedLabel}
              </Link>
            ) : (
              task.relatedLabel
            ),
        },
        {
          id: "assignedTo",
          header: "Assigned",
          muted: true,
          cell: (task) => task.assignedTo,
        },
        {
          id: "dueDate",
          header: "Due date",
          muted: true,
          cell: (task) => (
            <span className="whitespace-nowrap">{formatDate(task.dueDate)}</span>
          ),
        },
        {
          id: "priority",
          header: "Priority",
          cell: (task) => (
            <StatusBadge tone={PRIORITY_TONE[task.priority]}>
              {formatLabel(task.priority)}
            </StatusBadge>
          ),
        },
        {
          id: "status",
          header: "Status",
          cell: (task) => (
            <StatusBadge tone={STATUS_TONE[task.status]}>
              {formatLabel(task.status)}
            </StatusBadge>
          ),
        },
      ]}
    />
  );
}
