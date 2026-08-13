import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard";
import type { TaskViewMode } from "./utils";

type TaskSummaryProps = {
  counts: Record<TaskViewMode, number>;
};

const SUMMARY_ITEMS: {
  key: TaskViewMode;
  label: string;
  icon: LucideIcon;
  accent?: boolean;
}[] = [
  { key: "open", label: "Open tasks", icon: ClipboardList },
  { key: "overdue", label: "Overdue", icon: AlertTriangle, accent: true },
  { key: "due_today", label: "Due today", icon: CalendarClock },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
];

export function TaskSummary({ counts }: TaskSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {SUMMARY_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <KpiCard
            key={item.key}
            label={item.label}
            value={counts[item.key]}
            accent={item.accent}
            icon={<Icon className="size-5 stroke-[1.5]" aria-hidden />}
          />
        );
      })}
    </div>
  );
}
