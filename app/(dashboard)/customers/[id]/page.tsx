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
    <div className="flex w-full flex-col">
      <div className="border-b border-border px-5 py-5 sm:px-6 lg:px-8">
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
      </div>

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

          {/* Single 2-col grid: equal-height row cells, no staggered masonry */}
          <div className="grid lg:grid-cols-2">
            <div className="border-b border-border lg:border-r">
              <RelatedTasks
                tasks={data.tasks}
                emptyMessage="No tasks for this customer."
              />
            </div>
            <div className="border-b border-border">
              <CustomerAppointments appointments={data.appointments} />
            </div>
            <div className="border-b border-border lg:border-r lg:border-b-0">
              <CustomerServices services={data.services} />
            </div>
            <div className="border-b border-border lg:border-b-0">
              <CustomerInvoices invoices={data.invoices} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
