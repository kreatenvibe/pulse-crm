import { StatCard } from "@/components/dashboard/StatCard";
import type { TaskViewMode } from "./utils";

type TaskSummaryProps = {
  counts: Record<TaskViewMode, number>;
};

const SUMMARY_ITEMS: { key: TaskViewMode; label: string }[] = [
  { key: "open", label: "Open tasks" },
  { key: "overdue", label: "Overdue" },
  { key: "due_today", label: "Due today" },
  { key: "completed", label: "Completed" },
];

export function TaskSummary({ counts }: TaskSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SUMMARY_ITEMS.map((item) => (
        <StatCard key={item.key} label={item.label} value={counts[item.key]} />
      ))}
    </div>
  );
}
