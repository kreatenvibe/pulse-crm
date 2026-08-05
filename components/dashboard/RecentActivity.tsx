import {
  Calendar,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  UserPlus,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import { formatLabel, formatRelativeTime } from "@/lib/format";
import type { ActivityDto, ActivityType } from "@/types/activity";

type RecentActivityProps = {
  activities: ActivityDto[];
};

const ACTIVITY_STYLE: Record<
  ActivityType,
  { icon: LucideIcon; well: string; iconColor: string }
> = {
  call: {
    icon: Phone,
    well: "bg-info-soft",
    iconColor: "text-info",
  },
  email: {
    icon: Mail,
    well: "bg-brand-soft",
    iconColor: "text-brand",
  },
  whatsapp: {
    icon: MessageCircle,
    well: "bg-success-soft",
    iconColor: "text-success",
  },
  meeting: {
    icon: Calendar,
    well: "bg-warning-soft",
    iconColor: "text-warning",
  },
  status_change: {
    icon: RefreshCw,
    well: "bg-brand-soft",
    iconColor: "text-brand",
  },
  created: {
    icon: UserPlus,
    well: "bg-success-soft",
    iconColor: "text-success",
  },
  updated: {
    icon: RefreshCw,
    well: "bg-neutral-soft",
    iconColor: "text-neutral",
  },
  assigned: {
    icon: UserRoundPlus,
    well: "bg-info-soft",
    iconColor: "text-info",
  },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <section className="rounded-xl border border-border bg-surface shadow-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">Latest CRM events</p>
      </div>

      {activities.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-foreground-muted">
          No recent activity.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {activities.map((activity) => {
            const style = ACTIVITY_STYLE[activity.type];
            const Icon = style.icon;

            return (
              <li
                key={activity.id}
                className="flex items-start gap-3 px-5 py-3.5"
              >
                <span
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${style.well} ${style.iconColor}`}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{activity.description}</p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    {formatLabel(activity.type)} ·{" "}
                    {formatLabel(activity.entityType)} · {activity.entityId}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-foreground-muted">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
