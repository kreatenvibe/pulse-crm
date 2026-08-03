"use client";

import Link from "next/link";
import { Button, DataTable, EmptyState } from "@/components/ui";
import { formatDate, formatLabel, type LeadDto } from "./utils";

type LeadTableProps = {
  leads: LeadDto[];
};

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
          cell: (lead) => lead.name,
        },
        {
          id: "company",
          header: "Company",
          cell: (lead) => lead.company ?? "—",
        },
        {
          id: "phone",
          header: "Phone",
          cell: (lead) => lead.phone,
        },
        {
          id: "source",
          header: "Source",
          cell: (lead) => formatLabel(lead.source),
        },
        {
          id: "status",
          header: "Status",
          cell: (lead) => formatLabel(lead.status),
        },
        {
          id: "priority",
          header: "Priority",
          cell: (lead) => formatLabel(lead.priority),
        },
        {
          id: "assignedTo",
          header: "Assigned To",
          cell: (lead) => lead.assignedTo,
        },
        {
          id: "lastContacted",
          header: "Last Contacted",
          cell: (lead) => formatDate(lead.lastContactedAt),
        },
        {
          id: "actions",
          header: "Actions",
          cell: (lead) => (
            <div className="flex gap-2">
              <Link href={`/leads/${lead.id}`}>
                <Button size="sm">View</Button>
              </Link>
            </div>
          ),
        },
      ]}
    />
  );
}
