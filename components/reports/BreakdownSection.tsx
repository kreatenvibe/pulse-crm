import { DetailSection, EmptyState } from "@/components/ui";
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
    <DetailSection title={title} subtitle={subtitle}>
      {total === 0 ? (
        <EmptyState message={`No ${title.toLowerCase()} data yet.`} />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const percent =
              total > 0 ? Math.round((item.count / total) * 100) : 0;

            return (
              <li
                key={item.key}
                className="flex items-center justify-between gap-4 px-5 py-3 text-sm sm:px-6"
              >
                <span className="text-foreground">{item.label}</span>
                <span className="tabular-nums text-foreground-secondary">
                  {item.count}{" "}
                  <span className="text-xs text-foreground-muted">
                    ({percent}%)
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </DetailSection>
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
