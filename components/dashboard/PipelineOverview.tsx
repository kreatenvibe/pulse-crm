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

const STATUS_PILL: Record<LeadStatus, string> = {
  new: "bg-pipeline-new/15 text-pipeline-new",
  contacted: "bg-pipeline-contacted/15 text-pipeline-contacted",
  qualified: "bg-pipeline-qualified/15 text-pipeline-qualified",
  appointment_scheduled: "bg-pipeline-appointment/15 text-pipeline-appointment",
  converted: "bg-pipeline-converted/15 text-pipeline-converted",
  lost: "bg-pipeline-lost/15 text-pipeline-lost",
};

const STATUS_BAR: Record<LeadStatus, string> = {
  new: "bg-pipeline-new",
  contacted: "bg-pipeline-contacted",
  qualified: "bg-pipeline-qualified",
  appointment_scheduled: "bg-pipeline-appointment",
  converted: "bg-pipeline-converted",
  lost: "bg-pipeline-lost",
};

export function PipelineOverview({ byStatus, total }: PipelineOverviewProps) {
  return (
    <section className="rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Lead pipeline</h2>
          <p className="mt-0.5 text-xs text-foreground-muted">Leads by status</p>
        </div>
        <Link
          href="/leads"
          className="text-xs font-medium text-brand hover:text-brand-hover"
        >
          View all
        </Link>
      </div>

      {total === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-foreground-muted">
          No leads in the pipeline.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {STATUS_ORDER.map((status) => {
            const count = byStatus[status] ?? 0;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <li key={status} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${STATUS_PILL[status]}`}
                  >
                    {formatLabel(status)} · {count}
                  </span>
                  <span className="tabular-nums text-sm font-medium text-foreground-secondary">
                    {percent}%
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className={`h-full rounded-full ${STATUS_BAR[status]}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
