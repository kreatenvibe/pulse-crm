import Link from "next/link";
import { formatLabel } from "@/lib/format";
import type { LeadStatus } from "@/types/lead";

type PipelineOverviewProps = {
  byStatus: Record<LeadStatus, number>;
  total: number;
};

const STATUS_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "appointment_scheduled",
  "converted",
  "lost",
];

const STATUS_DOT: Record<LeadStatus, string> = {
  new: "bg-pipeline-new",
  contacted: "bg-pipeline-contacted",
  qualified: "bg-pipeline-qualified",
  appointment_scheduled: "bg-pipeline-appointment",
  converted: "bg-pipeline-converted",
  lost: "bg-pipeline-lost",
};

export function PipelineOverview({ byStatus, total }: PipelineOverviewProps) {
  return (
    <section className="border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-border p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Active lead pipeline
          </h2>
          <p className="mt-0.5 text-xs text-foreground-muted">
            Stage distribution
          </p>
        </div>
        <Link
          href="/leads"
          className="text-xs font-medium text-brand hover:text-brand-hover"
        >
          View all
        </Link>
      </div>

      {total === 0 ? (
        <div className="py-12 text-center text-sm text-foreground-muted">
          No leads in the pipeline.
        </div>
      ) : (
        <div className="p-5">
          <div className="mb-2 flex items-center justify-between text-xs text-foreground-muted">
            <span>Stage distribution</span>
            <span className="tabular-nums">{total} total leads</span>
          </div>

          <div className="flex h-3 w-full overflow-hidden rounded-full border border-border">
            {STATUS_ORDER.map((status) => {
              const count = byStatus[status] ?? 0;
              if (count === 0) return null;
              const percent = (count / total) * 100;

              return (
                <div
                  key={status}
                  className={`h-full ${STATUS_DOT[status]}`}
                  style={{ width: `${percent}%` }}
                  title={`${formatLabel(status)}: ${count}`}
                />
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
            {STATUS_ORDER.map((status) => {
              const count = byStatus[status] ?? 0;
              const percent = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={status}>
                  <div className="mb-1 flex items-center gap-1.5">
                    <span
                      className={`size-2 shrink-0 rounded-full ${STATUS_DOT[status]}`}
                    />
                    <span className="text-xs font-semibold text-foreground">
                      {formatLabel(status)}
                    </span>
                  </div>
                  <div className="text-sm text-foreground-secondary tabular-nums">
                    {count} ({percent}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
