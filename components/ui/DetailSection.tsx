import type { ReactNode } from "react";

type DetailSectionProps = {
  title: string;
  subtitle?: string;
  /** Optional right-aligned action (e.g. a "View all" link or button). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Section shell for detail pages: a self-contained card (hairline border on a
 * white surface) with a bordered header (title + optional subtitle/action)
 * above its content. Cards float inside the page's padded container with gaps,
 * matching the dashboard surfaces (KpiCard / PipelineOverview) rather than the
 * old edge-to-edge dividers that met the sidebar border.
 */
export function DetailSection({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: DetailSectionProps) {
  return (
    <section className={`border border-border bg-surface ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-foreground-muted">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** A labelled field for the definition grids inside a <DetailSection>. */
export function DetailField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-xs font-medium text-foreground-muted">{label}</dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  );
}
