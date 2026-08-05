"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CustomerAppointments,
  CustomerInvoices,
  CustomerProfile,
  CustomerServices,
  CustomerSummary,
  CustomerTimeline,
} from "@/components/customers";
import { RelatedTasks } from "@/components/tasks";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useCustomerDetails } from "@/hooks";

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data, loading, error } = useCustomerDetails(id);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <p className="text-sm text-foreground-muted">
        <Link
          href="/customers"
          className="text-brand hover:text-brand-hover hover:underline"
        >
          Customers
        </Link>
        <span className="mx-1.5 text-foreground-muted">/</span>
        <span className="text-foreground-secondary">
          {data?.customer.primaryContact ?? id}
        </span>
      </p>

      {loading ? (
        <LoadingState message="Loading customer…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : !data ? (
        <EmptyState message="Customer not found." />
      ) : (
        <>
          <CustomerProfile
            customer={data.customer}
            assignedUser={data.assignedUser}
            sourceLead={data.sourceLead}
          />

          <CustomerSummary
            tasks={data.tasks}
            appointments={data.appointments}
            services={data.services}
            invoices={data.invoices}
          />

          <CustomerTimeline
            activities={data.activities}
            notes={data.notes}
          />

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <RelatedTasks
              tasks={data.tasks}
              emptyMessage="No tasks for this customer."
            />
            <CustomerAppointments appointments={data.appointments} />
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <CustomerServices services={data.services} />
            <CustomerInvoices invoices={data.invoices} />
          </div>
        </>
      )}
    </div>
  );
}
