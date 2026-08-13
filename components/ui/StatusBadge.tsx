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

/** Filled tonal badges — Stitch status chips (24px, soft container fills). */
const TONE_CLASS: Record<StatusBadgeTone, string> = {
  brand: "bg-brand-soft text-brand-strong",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-error-container text-on-error-container",
  info: "bg-tertiary-container text-on-tertiary-container",
  neutral: "bg-surface-container-high text-on-surface-variant",
  "pipeline-new": "bg-surface-container-high text-on-surface-variant",
  "pipeline-contacted": "bg-tertiary-container text-on-tertiary-container",
  "pipeline-qualified": "bg-brand-soft text-brand-strong",
  "pipeline-appointment":
    "bg-secondary-container text-on-secondary-container border border-outline-variant",
  "pipeline-converted": "bg-surface-container-highest text-secondary",
  "pipeline-lost": "bg-error-container text-on-error-container",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className = "",
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex h-6 max-w-full items-center truncate rounded px-2 text-[11px] font-semibold ${TONE_CLASS[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
