import { EmptyState } from "@/components/ui";
import { formatDate, formatLabel } from "@/lib/format";
import type { TaskDto } from "@/types/task";

type LeadTasksProps = {
  tasks: TaskDto[];
};

export function LeadTasks({ tasks }: LeadTasksProps) {
  const sorted = [...tasks].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  return (
    <section className="rounded border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Tasks</h2>
        <p className="text-xs text-zinc-500">Related follow-ups</p>
      </div>

      {sorted.length === 0 ? (
        <EmptyState message="No tasks for this lead." />
      ) : (
        <ul className="divide-y divide-zinc-200">
          {sorted.map((task) => (
            <li key={task.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{task.title}</p>
                  {task.description ? (
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {task.description}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 text-xs text-zinc-500">
                  {formatLabel(task.status)}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Due {formatDate(task.dueDate)} · {formatLabel(task.priority)} ·{" "}
                {task.assignedTo}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
