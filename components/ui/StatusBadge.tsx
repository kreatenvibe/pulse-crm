import type { ReactNode } from "react";

export type StatusBadgeTone =
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "pipeline-new"
  | "pipeline-contacted"
  | "pipeline-qualified"
  | "pipeline-appointment"
  | "pipeline-converted"
  | "pipeline-lost";

type StatusBadgeProps = {
  children: ReactNode;
  tone?: StatusBadgeTone;
  className?: string;
};

/** Outline badges — thin border, no fill (matches reference table status chips). */
const TONE_CLASS: Record<StatusBadgeTone, string> = {
  brand: "border-brand/35 text-brand",
  success: "border-success/35 text-success",
  warning: "border-warning/40 text-warning",
  danger: "border-danger/35 text-danger",
  info: "border-info/35 text-info",
  neutral: "border-border-strong text-neutral",
  "pipeline-new": "border-pipeline-new/40 text-pipeline-new",
  "pipeline-contacted": "border-pipeline-contacted/40 text-pipeline-contacted",
  "pipeline-qualified": "border-pipeline-qualified/40 text-pipeline-qualified",
  "pipeline-appointment":
    "border-pipeline-appointment/40 text-pipeline-appointment",
  "pipeline-converted": "border-pipeline-converted/40 text-pipeline-converted",
  "pipeline-lost": "border-pipeline-lost/40 text-pipeline-lost",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center truncate rounded-md border bg-transparent px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
