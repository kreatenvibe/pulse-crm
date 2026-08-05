import Link from "next/link";
import { Building2, Mail, MapPin, Phone, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui";
import { formatLabel } from "@/lib/format";
import type {
  CustomerDto,
  CustomerLifecycleStatus,
} from "@/types/customer";
import type {
  CustomerAssignee,
  CustomerSourceLead,
} from "@/types/customer-details";

type CustomerProfileProps = {
  customer: CustomerDto;
  assignedUser: CustomerAssignee;
  sourceLead: CustomerSourceLead;
};

const LIFECYCLE_TONE: Record<CustomerLifecycleStatus, StatusBadgeTone> = {
  onboarding: "info",
  active: "success",
  inactive: "neutral",
  churned: "danger",
};

function MetaItem({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-secondary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-foreground-muted">{label}</p>
        <p className="mt-0.5 truncate text-sm text-foreground">{children}</p>
      </div>
    </div>
  );
}

export function CustomerProfile({
  customer,
  assignedUser,
  sourceLead,
}: CustomerProfileProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {customer.primaryContact}
            </h1>
            <StatusBadge tone={LIFECYCLE_TONE[customer.lifecycleStatus]}>
              {formatLabel(customer.lifecycleStatus)}
            </StatusBadge>
          </div>
          {customer.businessName ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-foreground-secondary">
              <Building2 className="size-3.5 shrink-0" aria-hidden />
              {customer.businessName}
            </p>
          ) : null}
        </div>

        <p className="text-sm text-foreground-secondary">
          Source lead:{" "}
          <Link
            href={`/leads/${sourceLead.id}`}
            className="font-medium text-brand hover:text-brand-hover hover:underline"
          >
            {sourceLead.name}
          </Link>
        </p>
      </div>

      <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetaItem
          icon={<Phone className="size-4" aria-hidden />}
          label="Phone"
        >
          <span className="tabular-nums">{customer.phone}</span>
        </MetaItem>
        <MetaItem
          icon={<Mail className="size-4" aria-hidden />}
          label="Email"
        >
          {customer.email ?? "—"}
        </MetaItem>
        <MetaItem
          icon={<MapPin className="size-4" aria-hidden />}
          label="Address"
        >
          {customer.address ?? "—"}
        </MetaItem>
        <MetaItem
          icon={<UserRound className="size-4" aria-hidden />}
          label="Assigned"
        >
          {assignedUser.name}
        </MetaItem>
      </div>
    </section>
  );
}
