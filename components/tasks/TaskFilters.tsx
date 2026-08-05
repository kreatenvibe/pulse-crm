"use client";

import { SelectFilter } from "@/components/ui";
import { formatLabel } from "@/lib/format";
import type { TaskPriority, TaskStatus } from "@/types/task";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskViewMode,
} from "./utils";

type TaskFiltersProps = {
  viewMode: TaskViewMode;
  status: TaskStatus | "";
  priority: TaskPriority | "";
  onViewModeChange: (value: TaskViewMode) => void;
  onStatusChange: (value: TaskStatus | "") => void;
  onPriorityChange: (value: TaskPriority | "") => void;
};

export function TaskFilters({
  viewMode,
  status,
  priority,
  onViewModeChange,
  onStatusChange,
  onPriorityChange,
}: TaskFiltersProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-card sm:p-4">
      <div className="flex flex-wrap items-end gap-3">
        <SelectFilter
          id="task-view"
          label="View"
          value={viewMode}
          options={[
            { value: "open", label: "Open tasks" },
            { value: "overdue", label: "Overdue" },
            { value: "due_today", label: "Due today" },
            { value: "completed", label: "Completed" },
          ]}
          onChange={(value) => onViewModeChange(value as TaskViewMode)}
        />

        <SelectFilter
          id="task-status"
          label="Status"
          value={status}
          allLabel="All statuses"
          options={TASK_STATUSES.map((item) => ({
            value: item,
            label: formatLabel(item),
          }))}
          onChange={(value) => onStatusChange(value as TaskStatus | "")}
        />

        <SelectFilter
          id="task-priority"
          label="Priority"
          value={priority}
          allLabel="All priorities"
          options={TASK_PRIORITIES.map((item) => ({
            value: item,
            label: formatLabel(item),
          }))}
          onChange={(value) => onPriorityChange(value as TaskPriority | "")}
        />
      </div>
    </div>
  );
}
