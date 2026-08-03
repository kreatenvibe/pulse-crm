import type { LeadDto, LeadSource, LeadStatus } from "@/types/lead";

export type { LeadDto };

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "appointment_scheduled",
  "converted",
  "lost",
];

export const LEAD_SOURCES: LeadSource[] = [
  "website",
  "whatsapp",
  "facebook",
  "instagram",
  "google",
  "referral",
  "walk_in",
  "phone",
];

export type SortOrder = "newest" | "oldest";

export function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function filterLeads(
  leads: LeadDto[],
  options: {
    search: string;
    status: LeadStatus | "";
    source: LeadSource | "";
    sort: SortOrder;
  },
): LeadDto[] {
  const query = options.search.trim().toLowerCase();

  const filtered = leads.filter((lead) => {
    if (options.status && lead.status !== options.status) return false;
    if (options.source && lead.source !== options.source) return false;

    if (!query) return true;

    const name = lead.name.toLowerCase();
    const company = (lead.company ?? "").toLowerCase();
    return name.includes(query) || company.includes(query);
  });

  return filtered.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return options.sort === "newest" ? bTime - aTime : aTime - bTime;
  });
}
