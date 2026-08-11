"use client";

import Link from "next/link";
import {
  DataTable,
  EmptyState,
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/ui";
import { formatDate, formatLabel } from "@/lib/format";
import type { ServiceDto, ServiceStatus } from "@/types/service";

type ServiceTableProps = {
  services: ServiceDto[];
  /** Resolved customer labels by id, for the Customer column. */
  customerNameById: Map<string, string>;
  emptyMessage?: string;
};

const STATUS_TONE: Record<ServiceStatus, StatusBadgeTone> = {
  planned: "info",
  in_progress: "brand",
  completed: "success",
  cancelled: "neutral",
};

export function ServiceTable({
  services,
  customerNameById,
  emptyMessage = "No services found.",
}: ServiceTableProps) {
  if (services.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <DataTable
      data={services}
      getRowId={(service) => service.id}
      columns={[
        {
          id: "title",
          header: "Title",
          cell: (service) => (
            <Link
              href={`/services/${service.id}`}
              className="block max-w-64 truncate font-medium text-brand hover:text-brand-hover hover:underline"
              title={service.title}
            >
              {service.title}
            </Link>
          ),
        },
        {
          id: "customer",
          header: "Customer",
          muted: true,
          cell: (service) => (
            <Link
              href={`/customers/${service.customerId}`}
              className="text-brand hover:text-brand-hover hover:underline"
            >
              {customerNameById.get(service.customerId) ?? service.customerId}
            </Link>
          ),
        },
        {
          id: "scheduledDate",
          header: "Scheduled",
          muted: true,
          cell: (service) => (
            <span className="whitespace-nowrap">
              {formatDate(service.scheduledDate)}
            </span>
          ),
        },
        {
          id: "status",
          header: "Status",
          cell: (service) => (
            <StatusBadge tone={STATUS_TONE[service.status]}>
              {formatLabel(service.status)}
            </StatusBadge>
          ),
        },
      ]}
    />
  );
}
