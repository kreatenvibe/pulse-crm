"use client";

import Link from "next/link";
import {
  Button,
  DataTable,
  EmptyState,
  StatusBadge,
} from "@/components/ui";
import { formatDate, formatLabel } from "@/lib/format";
import { LEAD_PRIORITY_TONE, LEAD_STATUS_TONE } from "@/lib/status-tone";
import type { LeadDto } from "./utils";

type LeadTableProps = {
  leads: LeadDto[];
};

function Truncate({
  value,
  className = "max-w-48",
}: {
  value: string;
  className?: string;
}) {
  return (
    <span className={`block truncate ${className}`} title={value}>
      {value}
    </span>
  );
}

export function LeadTable({ leads }: LeadTableProps) {
  if (leads.length === 0) {
    return <EmptyState message="No leads found." />;
  }

  return (
    <DataTable
      data={leads}
      getRowId={(lead) => lead.id}
      columns={[
        {
          id: "name",
          header: "Name",
          cell: (lead) => (
            <Truncate value={lead.name} className="font-semibold text-foreground" />
          ),
        },
        {
          id: "company",
          header: "Company",
          muted: true,
          cell: (lead) =>
            lead.company ? (
              <Truncate value={lead.company} />
            ) : (
              <span className="text-foreground-muted">—</span>
            ),
        },
        {
          id: "phone",
          header: "Phone",
          muted: true,
          cell: (lead) => (
            <span className="whitespace-nowrap tabular-nums">{lead.phone}</span>
          ),
        },
        {
          id: "source",
          header: "Source",
          muted: true,
          cell: (lead) => formatLabel(lead.source),
        },
        {
          id: "status",
          header: "Status",
          cell: (lead) => (
            <StatusBadge tone={LEAD_STATUS_TONE[lead.status]}>
              {formatLabel(lead.status)}
            </StatusBadge>
          ),
        },
        {
          id: "priority",
          header: "Priority",
          cell: (lead) => (
            <StatusBadge tone={LEAD_PRIORITY_TONE[lead.priority]}>
              {formatLabel(lead.priority)}
            </StatusBadge>
          ),
        },
        {
          id: "assignedTo",
          header: "Assigned",
          muted: true,
          cell: (lead) => (
            <Truncate value={lead.assignedTo} className="max-w-32 font-medium text-foreground" />
          ),
        },
        {
          id: "lastContacted",
          header: "Last contacted",
          muted: true,
          cell: (lead) => (
            <span className="whitespace-nowrap">
              {formatDate(lead.lastContactedAt)}
            </span>
          ),
        },
        {
          id: "actions",
          header: "Actions",
          align: "right",
          cell: (lead) => (
            <Link href={`/leads/${lead.id}`}>
              <Button size="sm" variant="ghost">
                View
              </Button>
            </Link>
          ),
        },
      ]}
    />
  );
}
