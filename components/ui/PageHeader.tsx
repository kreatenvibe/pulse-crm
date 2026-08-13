import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  count?: number;
  actions?: ReactNode;
};

/**
 * Canonical list-page header (the Leads/Customers full-bleed pattern):
 * full-width section with a bottom divider, title + optional count, optional
 * description, and right-aligned actions. Keep the markup in sync with the
 * shell padding used by FilterBar.
 */
export function PageHeader({
  title,
  description,
  count,
  actions,
}: PageHeaderProps) {
  return (
    <div className="border-b border-border px-5 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {count !== undefined ? (
              <span className="text-lg font-medium text-foreground-muted tabular-nums">
                {count}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-foreground-muted">{description}</p>
          ) : null}
        </div>
        {actions ? actions : null}
      </div>
    </div>
  );
}
