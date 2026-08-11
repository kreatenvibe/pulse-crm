"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
  type StatusBadgeTone,
} from "@/components/ui";
import { useCustomers, useService } from "@/hooks";
import { formatDate, formatLabel } from "@/lib/format";
import type { ServiceStatus } from "@/types/service";

const STATUS_TONE: Record<ServiceStatus, StatusBadgeTone> = {
  planned: "info",
  in_progress: "brand",
  completed: "success",
  cancelled: "neutral",
};

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
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-5 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm text-foreground-muted">
            <Link
              href="/services"
              className="text-brand hover:text-brand-hover hover:underline"
            >
              Services
            </Link>
            <span className="mx-1.5 text-foreground-muted">/</span>
            <span className="text-foreground-secondary">
              {service?.title ?? id}
            </span>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {service?.title ?? "Service details"}
          </h1>
        </div>
        {service ? (
          <Link href={`/services/${id}/edit`}>
            <Button>Edit service</Button>
          </Link>
        ) : null}
      </div>

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
          <dl className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Status
              </dt>
              <dd className="mt-1">
                <StatusBadge tone={STATUS_TONE[service.status]}>
                  {formatLabel(service.status)}
                </StatusBadge>
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Customer
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                <Link
                  href={`/customers/${service.customerId}`}
                  className="text-brand hover:text-brand-hover hover:underline"
                >
                  {customerLabel}
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-foreground-muted">
                Scheduled date
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {formatDate(service.scheduledDate)}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-foreground-muted">
                Description
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {service.description?.trim() ? service.description : "—"}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
