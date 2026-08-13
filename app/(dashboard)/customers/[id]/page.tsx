"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { useParams } from "next/navigation";
import {
  CustomerInvoices,
  CustomerProfile,
  CustomerServices,
  CustomerSummary,
} from "@/components/customers";
import { AppointmentsPanel, Timeline } from "@/components/shared";
import { RelatedTasks } from "@/components/tasks";
import {
  Button,
  DetailHeader,
  DetailMeta,
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "@/components/ui";
import { useCustomerDetails } from "@/hooks";
import { formatLabel } from "@/lib/format";
import { CUSTOMER_LIFECYCLE_TONE } from "@/lib/status-tone";

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, loading, error } = useCustomerDetails(id);

  return (
    <div className="flex w-full flex-col">
      <DetailHeader
        backHref="/customers"
        backLabel="Customers"
        title={data?.customer.primaryContact ?? id}
        badges={
          data ? (
            <StatusBadge
              tone={CUSTOMER_LIFECYCLE_TONE[data.customer.lifecycleStatus]}
            >
              {formatLabel(data.customer.lifecycleStatus)}
            </StatusBadge>
          ) : null
        }
        meta={
          data ? (
            <>
              {data.customer.businessName ? (
                <DetailMeta icon={<Building2 className="size-3.5" aria-hidden />}>
                  {data.customer.businessName}
                </DetailMeta>
              ) : null}
              <DetailMeta>
                Source lead:{" "}
                <Link
                  href={`/leads/${data.sourceLead.id}`}
                  className="font-medium text-brand hover:text-brand-hover hover:underline"
                >
                  {data.sourceLead.name}
                </Link>
              </DetailMeta>
            </>
          ) : null
        }
        actions={
          data ? (
            <Link href={`/customers/${id}/edit`}>
              <Button variant="primary">Edit customer</Button>
            </Link>
          ) : null
        }
      />

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading customer…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : !data ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <EmptyState message="Customer not found." />
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-5 py-6 sm:px-6 lg:px-8">
          <CustomerSummary
            tasks={data.tasks}
            appointments={data.appointments}
            services={data.services}
            invoices={data.invoices}
          />

          <CustomerProfile
            customer={data.customer}
            assignedUser={data.assignedUser}
          />

          <Timeline activities={data.activities} notes={data.notes} />

          {/* Related records as equal-height floating cards */}
          <div className="grid gap-6 lg:grid-cols-2">
            <RelatedTasks
              tasks={data.tasks}
              emptyMessage="No tasks for this customer."
            />
            <AppointmentsPanel
              appointments={data.appointments}
              emptyMessage="No appointments for this customer."
            />
            <CustomerServices services={data.services} />
            <CustomerInvoices invoices={data.invoices} />
          </div>
        </div>
      )}
    </div>
  );
}
