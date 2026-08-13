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

type TimelineProps = {
  activities: ActivityDto[];
  notes: NoteDto[];
};

type TimelineItem =
  | { kind: "activity"; at: string; id: string; activity: ActivityDto }
  | { kind: "note"; at: string; id: string; note: NoteDto };

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

/**
 * Merged activity + note feed, shared by lead and customer detail pages.
 * Activities and notes are interleaved and sorted newest-first.
 */
export function Timeline({ activities, notes }: TimelineProps) {
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
    <section className="border border-border bg-surface">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-foreground">Timeline</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Activities and notes
        </p>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-foreground-muted sm:px-6">
          No timeline events yet.
        </div>
      ) : (
        <ul>
          {items.map((item) => {
            if (item.kind === "activity") {
              const style = ACTIVITY_STYLE[item.activity.type];
              const Icon = style.icon;

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 border-b border-border px-5 py-3.5 last:border-b-0 sm:px-6"
                >
                  <span
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-muted ${style.iconColor}`}
                  >
                    <Icon className="size-4 stroke-[1.5]" aria-hidden />
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
                className="flex items-start gap-3 border-b border-border px-5 py-3.5 last:border-b-0 sm:px-6"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-neutral">
                  <NotebookPen className="size-4 stroke-[1.5]" aria-hidden />
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
