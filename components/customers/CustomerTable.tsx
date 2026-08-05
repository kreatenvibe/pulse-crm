"use client";

import Link from "next/link";
import {
  Button,
  DataTable,
  EmptyState,
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/ui";
import { formatLabel } from "@/lib/format";
import type { CustomerLifecycleStatus } from "@/types/customer";
import type { CustomerDto } from "./utils";

type CustomerTableProps = {
  customers: CustomerDto[];
};

const LIFECYCLE_TONE: Record<CustomerLifecycleStatus, StatusBadgeTone> = {
  onboarding: "info",
  active: "success",
  inactive: "neutral",
  churned: "danger",
};

export function CustomerTable({ customers }: CustomerTableProps) {
  if (customers.length === 0) {
    return <EmptyState message="No customers found." />;
  }

  return (
    <DataTable
      data={customers}
      getRowId={(customer) => customer.id}
      columns={[
        {
          id: "name",
          header: "Name",
          cell: (customer) => (
            <span
              className="block max-w-48 truncate font-medium text-foreground"
              title={customer.primaryContact}
            >
              {customer.primaryContact}
            </span>
          ),
        },
        {
          id: "company",
          header: "Company",
          muted: true,
          cell: (customer) =>
            customer.businessName ? (
              <span
                className="block max-w-48 truncate"
                title={customer.businessName}
              >
                {customer.businessName}
              </span>
            ) : (
              <span className="text-foreground-muted">—</span>
            ),
        },
        {
          id: "phone",
          header: "Phone",
          muted: true,
          cell: (customer) => (
            <span className="whitespace-nowrap tabular-nums">
              {customer.phone}
            </span>
          ),
        },
        {
          id: "email",
          header: "Email",
          muted: true,
          cell: (customer) =>
            customer.email ? (
              <span
                className="block max-w-56 truncate"
                title={customer.email}
              >
                {customer.email}
              </span>
            ) : (
              <span className="text-foreground-muted">—</span>
            ),
        },
        {
          id: "lifecycle",
          header: "Lifecycle",
          cell: (customer) => (
            <StatusBadge tone={LIFECYCLE_TONE[customer.lifecycleStatus]}>
              {formatLabel(customer.lifecycleStatus)}
            </StatusBadge>
          ),
        },
        {
          id: "assignedTo",
          header: "Assigned",
          muted: true,
          cell: (customer) => (
            <span
              className="block max-w-32 truncate"
              title={customer.assignedTo}
            >
              {customer.assignedTo}
            </span>
          ),
        },
        {
          id: "sourceLead",
          header: "Source lead",
          muted: true,
          cell: (customer) => (
            <Link
              href={`/leads/${customer.leadId}`}
              className="text-sm text-brand hover:text-brand-hover hover:underline"
            >
              {customer.leadId}
            </Link>
          ),
        },
        {
          id: "actions",
          header: "Actions",
          align: "right",
          cell: (customer) => (
            <Link href={`/customers/${customer.id}`}>
              <Button size="sm">View</Button>
            </Link>
          ),
        },
      ]}
    />
  );
}
