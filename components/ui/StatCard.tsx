import type { ReactNode } from "react";

export type StatTone =
  | "brand"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "neutral";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  tone?: StatTone;
  className?: string;
};

const toneStyles: Record<StatTone, { icon: string; hint: string }> = {
  brand: {
    icon: "text-brand",
    hint: "text-brand",
  },
  success: {
    icon: "text-success",
    hint: "text-success",
  },
  danger: {
    icon: "text-danger",
    hint: "text-danger",
  },
  warning: {
    icon: "text-warning",
    hint: "text-warning",
  },
  info: {
    icon: "text-info",
    hint: "text-info",
  },
  neutral: {
    icon: "text-neutral",
    hint: "text-foreground-muted",
  },
};

/**
 * Flat metric cell — no card chrome. Place in a divided metrics row
 * to match the reference KPI strip.
 */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  className = "",
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className={`min-w-0 py-1 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-foreground-secondary">{label}</p>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
        </div>
        {icon ? (
          <span className={`mt-1 shrink-0 ${styles.icon}`}>{icon}</span>
        ) : null}
      </div>
      {hint ? (
        <p className={`mt-2 text-xs font-medium ${styles.hint}`}>{hint}</p>
      ) : null}
    </div>
  );
}
