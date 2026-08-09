import type { LeadDto, LeadSource, LeadStatus } from "@/types/lead";

export type { LeadDto };

// Single source of truth for domain vocabularies: lib/schemas/enums.ts.
export { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/schemas/enums";

export type SortOrder = "newest" | "oldest";

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
