import { Mail, MapPin, Phone, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { DetailSection } from "@/components/ui";
import type { CustomerDto } from "@/types/customer";
import type { CustomerAssignee } from "@/types/customer-details";

type CustomerProfileProps = {
  customer: CustomerDto;
  assignedUser: CustomerAssignee;
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
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-foreground-secondary">
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
}: CustomerProfileProps) {
  return (
    <DetailSection title="Contact" subtitle="Primary contact details">
      <div className="grid gap-4 px-5 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <MetaItem icon={<Phone className="size-4" aria-hidden />} label="Phone">
          <span className="tabular-nums">{customer.phone}</span>
        </MetaItem>
        <MetaItem icon={<Mail className="size-4" aria-hidden />} label="Email">
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
    </DetailSection>
  );
}
