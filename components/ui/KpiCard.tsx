import type { ReactNode } from "react";

type KpiCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  hintIcon?: ReactNode;
  icon?: ReactNode;
  /** Draw the left accent bar and tint the label/icon to highlight this metric. */
  accent?: boolean;
  /** Render the value in a monospaced face (used for currency figures). */
  mono?: boolean;
};

/**
 * Bordered KPI card shared across the metric strips — dashboard, tasks list,
 * reports, and the detail-page summaries all compose these in a grid. Distinct
 * from the flat `StatCard` cell used inside bordered report cards.
 */
export function KpiCard({
  label,
  value,
  hint,
  hintIcon,
  icon,
  accent = false,
  mono = false,
}: KpiCardProps) {
  return (
    <div
      className={`border border-border bg-surface p-4 ${
        accent ? "border-l-2 border-l-brand" : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <span
          className={`eyebrow ${
            accent ? "text-brand" : "text-foreground-secondary"
          }`}
        >
          {label}
        </span>
        {icon ? (
          <span
            className={`shrink-0 ${accent ? "text-brand" : "text-foreground-muted"}`}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <div
        className={`text-3xl font-semibold tracking-tight text-foreground tabular-nums ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
      {hint ? (
        <div className="mt-2 flex items-center gap-1 text-xs text-foreground-secondary">
          {hintIcon ? <span className="shrink-0">{hintIcon}</span> : null}
          <span>{hint}</span>
        </div>
      ) : null}
    </div>
  );
}
