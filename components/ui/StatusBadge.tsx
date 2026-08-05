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

const TONE_CLASS: Record<StatusBadgeTone, string> = {
  brand: "bg-brand-soft text-brand",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  neutral: "bg-neutral-soft text-neutral",
  "pipeline-new": "bg-pipeline-new/15 text-pipeline-new",
  "pipeline-contacted": "bg-pipeline-contacted/15 text-pipeline-contacted",
  "pipeline-qualified": "bg-pipeline-qualified/15 text-pipeline-qualified",
  "pipeline-appointment":
    "bg-pipeline-appointment/15 text-pipeline-appointment",
  "pipeline-converted": "bg-pipeline-converted/15 text-pipeline-converted",
  "pipeline-lost": "bg-pipeline-lost/15 text-pipeline-lost",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center truncate rounded-md px-2 py-1 text-xs font-medium ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
