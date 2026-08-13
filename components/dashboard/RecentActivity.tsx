import { formatLabel, formatRelativeTime } from "@/lib/format";
import type { ActivityDto } from "@/types/activity";

type RecentActivityProps = {
  activities: ActivityDto[];
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <section className="flex h-full flex-col border border-border bg-surface">
      <div className="border-b border-border p-5">
        <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">Latest CRM events</p>
      </div>

      {activities.length === 0 ? (
        <div className="flex-1 py-12 text-center text-sm text-foreground-muted">
          No recent activity.
        </div>
      ) : (
        <div className="flex-1 p-5">
          <ol className="relative ml-1.5 space-y-6 border-l border-border">
            {activities.map((activity, index) => (
              <li key={activity.id} className="relative pl-6">
                <span
                  className={`absolute top-1 -left-1.25 size-2.5 rounded-full border-2 bg-surface ${
                    index === 0 ? "border-brand" : "border-border-strong"
                  }`}
                  aria-hidden
                />
                <div className="mb-0.5 flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {formatLabel(activity.type)}
                  </span>
                  <span className="shrink-0 text-xs text-foreground-muted">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-foreground-secondary">
                  {activity.description}
                </p>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  {formatLabel(activity.entityType)} · {activity.entityId}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
