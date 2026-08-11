"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customers";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useCustomerDetails } from "@/hooks";

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

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
          <Link
            href={`/customers/${id}`}
            className="text-brand hover:text-brand-hover hover:underline"
          >
            {data?.customer.primaryContact ?? id}
          </Link>
          <span className="mx-1.5 text-foreground-muted">/</span>
          <span className="text-foreground-secondary">Edit</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Edit customer
        </h1>
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
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <CustomerForm
            mode="edit"
            customer={data.customer}
            onSuccess={() => router.push(`/customers/${id}`)}
            onCancel={() => router.push(`/customers/${id}`)}
          />
        </div>
      )}
    </div>
  );
}
