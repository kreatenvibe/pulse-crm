import {
  Calendar,
  Mail,
  MessageCircle,
  NotebookPen,
  Phone,
  RefreshCw,
  UserPlus,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import { formatDateTime, formatLabel } from "@/lib/format";
import type { ActivityDto, ActivityType } from "@/types/activity";
import type { NoteDto } from "@/types/note";

type CustomerTimelineProps = {
  activities: ActivityDto[];
  notes: NoteDto[];
};

type TimelineItem =
  | { kind: "activity"; at: string; id: string; activity: ActivityDto }
  | { kind: "note"; at: string; id: string; note: NoteDto };

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

export function CustomerTimeline({
  activities,
  notes,
}: CustomerTimelineProps) {
  const items: TimelineItem[] = [
    ...activities.map((activity) => ({
      kind: "activity" as const,
      id: activity.id,
      at: activity.timestamp,
      activity,
    })),
    ...notes.map((note) => ({
      kind: "note" as const,
      id: note.id,
      at: note.createdAt,
      note,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <section className="rounded-xl border border-border bg-surface shadow-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Activities and notes
        </p>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-foreground-muted">
          No timeline events yet.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            if (item.kind === "activity") {
              const style = ACTIVITY_STYLE[item.activity.type];
              const Icon = style.icon;

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 px-5 py-3.5"
                >
                  <span
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${style.well} ${style.iconColor}`}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      {item.activity.description}
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-muted">
                      {formatLabel(item.activity.type)} ·{" "}
                      {formatDateTime(item.activity.timestamp)} ·{" "}
                      {item.activity.performedBy}
                    </p>
                  </div>
                </li>
              );
            }

            return (
              <li
                key={item.id}
                className="flex items-start gap-3 px-5 py-3.5"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-soft text-neutral">
                  <NotebookPen className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm whitespace-pre-wrap text-foreground">
                    {item.note.content}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground-muted">
                    Note · {formatDateTime(item.note.createdAt)} ·{" "}
                    {item.note.createdBy}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
