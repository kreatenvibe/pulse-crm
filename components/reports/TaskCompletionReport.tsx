import { StatCard } from "@/components/dashboard";
import { DetailSection, EmptyState } from "@/components/ui";

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
    <DetailSection title="Tasks" subtitle="Open vs completed">
      {total === 0 ? (
        <EmptyState message="No tasks yet." />
      ) : (
        <div className="grid gap-4 px-5 py-6 sm:grid-cols-3 sm:px-6">
          <StatCard label="Open" value={open} />
          <StatCard label="Completed" value={completed} />
          <StatCard label="Total" value={total} />
        </div>
      )}
    </DetailSection>
  );
}
