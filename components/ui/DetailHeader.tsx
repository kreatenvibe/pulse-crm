import Link from "next/link";
import type { ReactNode } from "react";

type DetailHeaderProps = {
  /** Parent list route, e.g. "/customers". */
  backHref: string;
  /** Parent list label, e.g. "Customers". */
  backLabel: string;
  /** Primary entity title (also used as the breadcrumb leaf). */
  title: string;
  /** Rendered status/priority badges shown next to the title. */
  badges?: ReactNode;
  /** Supporting metadata row — compose with <DetailMeta> items. */
  meta?: ReactNode;
  /** Action buttons (Edit, More, Delete, …). */
  actions?: ReactNode;
};

/**
 * Standard detail-page header: breadcrumb, dominant title with inline badges,
 * a quiet supporting metadata row, and a right-aligned actions cluster.
 * Shared by every `[id]` detail page so they read as one product.
 */
export function DetailHeader({
  backHref,
  backLabel,
  title,
  badges,
  meta,
  actions,
}: DetailHeaderProps) {
  return (
    <div className="border-b border-border px-5 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <p className="text-sm text-foreground-muted">
            <Link
              href={backHref}
              className="text-brand hover:text-brand-hover hover:underline"
            >
              {backLabel}
            </Link>
            <span className="mx-1.5 text-foreground-muted">/</span>
            <span className="text-foreground-secondary">{title}</span>
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {badges ? (
              <div className="flex flex-wrap items-center gap-2">{badges}</div>
            ) : null}
          </div>

          {meta ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-foreground-secondary">
              {meta}
            </div>
          ) : null}
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** A single icon + value item for the <DetailHeader> meta row. */
export function DetailMeta({
  icon,
  children,
}: {
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      {icon ? <span className="shrink-0 text-foreground-muted">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </span>
  );
}
