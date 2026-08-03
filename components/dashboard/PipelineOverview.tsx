import { EmptyState } from "@/components/ui";
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

export function PipelineOverview({ byStatus, total }: PipelineOverviewProps) {
  return (
    <section className="rounded border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Pipeline overview</h2>
        <p className="text-xs text-zinc-500">Leads by status</p>
      </div>

      {total === 0 ? (
        <EmptyState message="No leads in the pipeline." />
      ) : (
        <ul className="divide-y divide-zinc-200">
          {STATUS_ORDER.map((status) => {
            const count = byStatus[status] ?? 0;
            const percent = total > 0 ? Math.round((count / total) * 100) : 0;

            return (
              <li
                key={status}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span>{formatLabel(status)}</span>
                <span className="tabular-nums text-zinc-600">
                  {count}{" "}
                  <span className="text-xs text-zinc-400">({percent}%)</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
