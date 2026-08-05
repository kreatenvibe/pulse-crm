import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/ui";

type TaskCompletionReportProps = {
  total: number;
  open: number;
  completed: number;
};

export function TaskCompletionReport({
  total,
  open,
  completed,
}: TaskCompletionReportProps) {
  return (
    <section className="rounded border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Tasks</h2>
        <p className="text-xs text-zinc-500">Open vs completed</p>
      </div>

      {total === 0 ? (
        <EmptyState message="No tasks yet." />
      ) : (
        <div className="grid gap-4 p-4 sm:grid-cols-3">
          <StatCard label="Open" value={open} />
          <StatCard label="Completed" value={completed} />
          <StatCard label="Total" value={total} />
        </div>
      )}
    </section>
  );
}
