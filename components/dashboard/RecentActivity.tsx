import { EmptyState } from "@/components/ui";
import { formatDateTime, formatLabel } from "@/lib/format";
import type { ActivityDto } from "@/types/activity";

type RecentActivityProps = {
  activities: ActivityDto[];
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <section className="rounded border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <p className="text-xs text-zinc-500">Latest CRM events</p>
      </div>

      {activities.length === 0 ? (
        <EmptyState message="No recent activity." />
      ) : (
        <ul className="divide-y divide-zinc-200">
          {activities.map((activity) => (
            <li key={activity.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm">{activity.description}</p>
                <span className="shrink-0 text-xs text-zinc-500">
                  {formatLabel(activity.type)}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {formatLabel(activity.entityType)} · {activity.entityId} ·{" "}
                {formatDateTime(activity.timestamp)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
