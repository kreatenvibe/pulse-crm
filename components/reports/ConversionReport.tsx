import { Percent, TrendingUp, UserRound } from "lucide-react";
import { KpiCard } from "@/components/ui";

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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KpiCard
        label="Conversion rate"
        value={`${conversionRate}%`}
        hint="Converted share of all leads"
        hintIcon={<TrendingUp className="size-3.5" aria-hidden />}
        icon={<Percent className="size-5 stroke-[1.5]" aria-hidden />}
        accent
      />
      <KpiCard
        label="Converted leads"
        value={converted}
        icon={<TrendingUp className="size-5 stroke-[1.5]" aria-hidden />}
      />
      <KpiCard
        label="Total leads"
        value={total}
        icon={<UserRound className="size-5 stroke-[1.5]" aria-hidden />}
      />
    </div>
  );
}
