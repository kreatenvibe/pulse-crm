import { EmptyState } from "@/components/ui";
import { formatLabel } from "@/lib/format";

type BreakdownItem = {
  key: string;
  label: string;
  count: number;
};

type BreakdownSectionProps = {
  title: string;
  subtitle: string;
  items: BreakdownItem[];
  total: number;
};

export function BreakdownSection({
  title,
  subtitle,
  items,
  total,
}: BreakdownSectionProps) {
  return (
    <section className="rounded border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </div>

      {total === 0 ? (
        <EmptyState message={`No ${title.toLowerCase()} data yet.`} />
      ) : (
        <ul className="divide-y divide-zinc-200">
          {items.map((item) => {
            const percent =
              total > 0 ? Math.round((item.count / total) * 100) : 0;

            return (
              <li
                key={item.key}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
              >
                <span>{item.label}</span>
                <span className="tabular-nums text-zinc-600">
                  {item.count}{" "}
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

export function breakdownFromRecord(
  record: Record<string, number>,
  order: string[],
): BreakdownItem[] {
  return order.map((key) => ({
    key,
    label: formatLabel(key),
    count: record[key as keyof typeof record] ?? 0,
  }));
}
