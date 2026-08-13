import { DetailField, DetailSection } from "@/components/ui";
import { formatDate, formatLabel } from "@/lib/format";
import type { LeadDto } from "@/types/lead";
import type { LeadAssignee } from "@/types/lead-details";

type LeadProfileProps = {
  lead: LeadDto;
  assignedUser: LeadAssignee;
};

export function LeadProfile({ lead, assignedUser }: LeadProfileProps) {
  return (
    <DetailSection title="Lead profile" subtitle="Contact and source details">
      <dl className="grid gap-4 px-5 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        <DetailField label="Company">{lead.company ?? "—"}</DetailField>
        <DetailField label="Phone">
          <span className="tabular-nums">{lead.phone}</span>
        </DetailField>
        <DetailField label="Email">{lead.email ?? "—"}</DetailField>
        <DetailField label="Source">{formatLabel(lead.source)}</DetailField>
        <DetailField label="Assigned user">{assignedUser.name}</DetailField>
        <DetailField label="Last contacted">
          {formatDate(lead.lastContactedAt)}
        </DetailField>
      </dl>

      {lead.message ? (
        <div className="border-t border-border px-5 py-5 sm:px-6">
          <p className="text-sm text-foreground-secondary">{lead.message}</p>
        </div>
      ) : null}
    </DetailSection>
  );
}
