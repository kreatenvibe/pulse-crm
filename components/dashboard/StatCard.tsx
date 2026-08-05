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
};

const toneStyles: Record<
  StatTone,
  { iconWell: string; icon: string; hintDot: string }
> = {
  brand: {
    iconWell: "bg-brand-soft",
    icon: "text-brand",
    hintDot: "bg-brand",
  },
  success: {
    iconWell: "bg-success-soft",
    icon: "text-success",
    hintDot: "bg-success",
  },
  danger: {
    iconWell: "bg-danger-soft",
    icon: "text-danger",
    hintDot: "bg-danger",
  },
  warning: {
    iconWell: "bg-warning-soft",
    icon: "text-warning",
    hintDot: "bg-warning",
  },
  info: {
    iconWell: "bg-info-soft",
    icon: "text-info",
    hintDot: "bg-info",
  },
  neutral: {
    iconWell: "bg-neutral-soft",
    icon: "text-neutral",
    hintDot: "bg-neutral",
  },
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: StatCardProps) {
  const styles = toneStyles[tone];

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-foreground-secondary">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
        </div>
        {icon ? (
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${styles.iconWell} ${styles.icon}`}
          >
            {icon}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-foreground-muted">
          <span
            className={`size-1.5 shrink-0 rounded-full ${styles.hintDot}`}
            aria-hidden
          />
          {hint}
        </p>
      ) : null}
    </div>
  );
}
