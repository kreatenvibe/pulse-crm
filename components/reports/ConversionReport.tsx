import { StatCard } from "@/components/dashboard/StatCard";

type ConversionReportProps = {
  total: number;
  converted: number;
  conversionRate: number;
};

export function ConversionReport({
  total,
  converted,
  conversionRate,
}: ConversionReportProps) {
  return (
    <section className="rounded border border-zinc-200">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-sm font-semibold">Lead conversion</h2>
        <p className="text-xs text-zinc-500">
          Converted leads as a share of all leads
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-3">
        <StatCard label="Conversion rate" value={`${conversionRate}%`} />
        <StatCard label="Converted leads" value={converted} />
        <StatCard label="Total leads" value={total} />
      </div>
    </section>
  );
}
