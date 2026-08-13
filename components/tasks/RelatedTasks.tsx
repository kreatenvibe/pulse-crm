import { StatusBadge } from "@/components/ui";
import { formatDate, formatLabel } from "@/lib/format";
import { TASK_PRIORITY_TONE, TASK_STATUS_TONE } from "@/lib/status-tone";
import type { TaskDto } from "@/types/task";

type RelatedTasksProps = {
  tasks: TaskDto[];
  emptyMessage?: string;
};

export function RelatedTasks({
  tasks,
  emptyMessage = "No tasks.",
}: RelatedTasksProps) {
  const sorted = [...tasks].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  return (
    <section className="h-full border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-foreground">Tasks</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Related follow-ups
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-foreground-muted sm:px-6">
          {emptyMessage}
        </div>
      ) : (
        <ul>
          {sorted.map((task) => (
            <li
              key={task.id}
              className="border-b border-border px-5 py-3.5 last:border-b-0 sm:px-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  {task.description ? (
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      {task.description}
                    </p>
                  ) : null}
                </div>
                <StatusBadge tone={TASK_STATUS_TONE[task.status]}>
                  {formatLabel(task.status)}
                </StatusBadge>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
                <span>Due {formatDate(task.dueDate)}</span>
                <span aria-hidden>·</span>
                <StatusBadge tone={TASK_PRIORITY_TONE[task.priority]}>
                  {formatLabel(task.priority)}
                </StatusBadge>
                <span aria-hidden>·</span>
                <span>{task.assignedTo}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
