import { formatLabel } from "@/lib/format";
import type { LeadDto } from "@/types/lead";
import type { LeadAssignee } from "@/types/lead-details";

type LeadProfileProps = {
  lead: LeadDto;
  assignedUser: LeadAssignee;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

export function LeadProfile({ lead, assignedUser }: LeadProfileProps) {
  return (
    <section className="rounded border border-zinc-200 p-4">
      <h2 className="text-sm font-semibold">Lead profile</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Name" value={lead.name} />
        <Field label="Company" value={lead.company ?? "—"} />
        <Field label="Phone" value={lead.phone} />
        <Field label="Email" value={lead.email ?? "—"} />
        <Field label="Source" value={formatLabel(lead.source)} />
        <Field label="Status" value={formatLabel(lead.status)} />
        <Field label="Priority" value={formatLabel(lead.priority)} />
        <Field label="Assigned user" value={assignedUser.name} />
      </dl>
      {lead.message ? (
        <p className="mt-4 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
          {lead.message}
        </p>
      ) : null}
    </section>
  );
}
