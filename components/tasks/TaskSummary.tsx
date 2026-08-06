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
    <div className="grid gap-6 border-y border-border py-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border">
      {SUMMARY_ITEMS.map((item, index) => (
        <StatCard
          key={item.key}
          className={
            index === 0
              ? "lg:pr-8"
              : index === SUMMARY_ITEMS.length - 1
                ? "lg:pl-8"
                : "lg:px-8"
          }
          label={item.label}
          value={counts[item.key]}
        />
      ))}
    </div>
  );
}
