"use client";

import Link from "next/link";
import { CalendarDays, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import {
  Button,
  DetailField,
  DetailHeader,
  DetailMeta,
  DetailSection,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@/components/ui";
import { useCustomers, useService } from "@/hooks";
import { formatDate, formatLabel } from "@/lib/format";
import { SERVICE_STATUS_TONE } from "@/lib/status-tone";

export default function ServiceDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: service, loading, error } = useService(id);
  const { data: customers } = useCustomers();

  const customer = customers.find((c) => c.id === service?.customerId);
  const customerLabel = customer
    ? customer.businessName
      ? `${customer.businessName} — ${customer.primaryContact}`
      : customer.primaryContact
    : (service?.customerId ?? "—");

  return (
    <div className="flex w-full flex-col">
      <DetailHeader
        backHref="/services"
        backLabel="Services"
        title={service?.title ?? id}
        badges={
          service ? (
            <StatusBadge tone={SERVICE_STATUS_TONE[service.status]}>
              {formatLabel(service.status)}
            </StatusBadge>
          ) : null
        }
        meta={
          service ? (
            <>
              <DetailMeta icon={<UserRound className="size-3.5" aria-hidden />}>
                <Link
                  href={`/customers/${service.customerId}`}
                  className="font-medium text-brand hover:text-brand-hover hover:underline"
                >
                  {customerLabel}
                </Link>
              </DetailMeta>
              <DetailMeta icon={<CalendarDays className="size-3.5" aria-hidden />}>
                {service.scheduledDate
                  ? `Scheduled ${formatDate(service.scheduledDate)}`
                  : "Not scheduled"}
              </DetailMeta>
            </>
          ) : null
        }
        actions={
          service ? (
            <Link href={`/services/${id}/edit`}>
              <Button variant="primary">Edit service</Button>
            </Link>
          ) : null
        }
      />

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading service…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : !service ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <EmptyState message="Service not found." />
        </div>
      ) : (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <DetailSection title="Service details" subtitle="Customer and scheduling">
            <dl className="grid gap-4 px-5 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
            <DetailField label="Customer">
              <Link
                href={`/customers/${service.customerId}`}
                className="text-brand hover:text-brand-hover hover:underline"
              >
                {customerLabel}
              </Link>
            </DetailField>
            <DetailField label="Scheduled date">
              {formatDate(service.scheduledDate)}
            </DetailField>
            <DetailField label="Created">
              {formatDate(service.createdAt)}
            </DetailField>
            </dl>

            <div className="border-t border-border px-5 py-5 sm:px-6">
              <p className="text-xs font-medium text-foreground-muted">
                Description
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground">
                {service.description?.trim() ? service.description : "—"}
              </p>
            </div>
          </DetailSection>
        </div>
      )}
    </div>
  );
}
