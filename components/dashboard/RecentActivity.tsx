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
  { icon: LucideIcon; iconColor: string }
> = {
  call: {
    icon: Phone,
    iconColor: "text-info",
  },
  email: {
    icon: Mail,
    iconColor: "text-brand",
  },
  whatsapp: {
    icon: MessageCircle,
    iconColor: "text-success",
  },
  meeting: {
    icon: Calendar,
    iconColor: "text-warning",
  },
  status_change: {
    icon: RefreshCw,
    iconColor: "text-brand",
  },
  created: {
    icon: UserPlus,
    iconColor: "text-success",
  },
  updated: {
    icon: RefreshCw,
    iconColor: "text-neutral",
  },
  assigned: {
    icon: UserRoundPlus,
    iconColor: "text-info",
  },
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <section>
      <div className="border-b border-border pb-4">
        <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">Latest CRM events</p>
      </div>

      {activities.length === 0 ? (
        <div className="py-10 text-center text-sm text-foreground-muted">
          No recent activity.
        </div>
      ) : (
        <ul>
          {activities.map((activity) => {
            const style = ACTIVITY_STYLE[activity.type];
            const Icon = style.icon;

            return (
              <li
                key={activity.id}
                className="flex items-start gap-3 border-b border-border py-3.5 last:border-b-0"
              >
                <span
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted ${style.iconColor}`}
                >
                  <Icon className="size-4 stroke-[1.5]" aria-hidden />
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
