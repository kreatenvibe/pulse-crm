import { EmptyState } from "@/components/ui";
import { formatDateTime, formatLabel } from "@/lib/format";
import type { ActivityDto } from "@/types/activity";
import type { NoteDto } from "@/types/note";

type LeadTimelineProps = {
  activities: ActivityDto[];
  notes: NoteDto[];
};

type TimelineItem =
  | { kind: "activity"; at: string; id: string; activity: ActivityDto }
  | { kind: "note"; at: string; id: string; note: NoteDto };

export function LeadTimeline({ activities, notes }: LeadTimelineProps) {
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
    <section className="rounded border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Timeline</h2>
        <p className="text-xs text-zinc-500">Activities and notes</p>
      </div>

      {items.length === 0 ? (
        <EmptyState message="No timeline events yet." />
      ) : (
        <ul className="divide-y divide-zinc-200">
          {items.map((item) =>
            item.kind === "activity" ? (
              <li key={item.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm">{item.activity.description}</p>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {formatLabel(item.activity.type)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatDateTime(item.activity.timestamp)} ·{" "}
                  {item.activity.performedBy}
                </p>
              </li>
            ) : (
              <li key={item.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm whitespace-pre-wrap">{item.note.content}</p>
                  <span className="shrink-0 text-xs text-zinc-500">Note</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatDateTime(item.note.createdAt)} · {item.note.createdBy}
                </p>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
