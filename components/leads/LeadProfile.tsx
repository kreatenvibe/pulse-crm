import { StatusBadge, type StatusBadgeTone } from "@/components/ui";
import { formatLabel } from "@/lib/format";
import type { LeadDto, LeadPriority, LeadStatus } from "@/types/lead";
import type { LeadAssignee } from "@/types/lead-details";

type LeadProfileProps = {
  lead: LeadDto;
  assignedUser: LeadAssignee;
};

const STATUS_TONE: Record<LeadStatus, StatusBadgeTone> = {
  new: "pipeline-new",
  contacted: "pipeline-contacted",
  qualified: "pipeline-qualified",
  appointment_scheduled: "pipeline-appointment",
  converted: "pipeline-converted",
  lost: "pipeline-lost",
};

const PRIORITY_TONE: Record<LeadPriority, StatusBadgeTone> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-foreground-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function LeadProfile({ lead, assignedUser }: LeadProfileProps) {
  return (
    <section className="border-b border-border px-5 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-sm font-semibold text-foreground">Lead profile</h2>
        <StatusBadge tone={STATUS_TONE[lead.status]}>
          {formatLabel(lead.status)}
        </StatusBadge>
        <StatusBadge tone={PRIORITY_TONE[lead.priority]}>
          {formatLabel(lead.priority)}
        </StatusBadge>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name" value={lead.name} />
        <Field label="Company" value={lead.company ?? "—"} />
        <Field label="Phone" value={lead.phone} />
        <Field label="Email" value={lead.email ?? "—"} />
        <Field label="Source" value={formatLabel(lead.source)} />
        <Field label="Assigned user" value={assignedUser.name} />
      </dl>

      {lead.message ? (
        <p className="mt-5 border-t border-border pt-5 text-sm text-foreground-secondary">
          {lead.message}
        </p>
      ) : null}
    </section>
  );
}
