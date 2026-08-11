"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ServiceForm } from "@/components/services";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useService } from "@/hooks";

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { data: service, loading, error } = useService(id);

  return (
    <div className="flex w-full flex-col">
      <div className="border-b border-border px-5 py-5 sm:px-6 lg:px-8">
        <p className="text-sm text-foreground-muted">
          <Link
            href="/services"
            className="text-brand hover:text-brand-hover hover:underline"
          >
            Services
          </Link>
          <span className="mx-1.5 text-foreground-muted">/</span>
          <Link
            href={`/services/${id}`}
            className="text-brand hover:text-brand-hover hover:underline"
          >
            {service?.title ?? id}
          </Link>
          <span className="mx-1.5 text-foreground-muted">/</span>
          <span className="text-foreground-secondary">Edit</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Edit service
        </h1>
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
          <ServiceForm
            mode="edit"
            service={service}
            onSuccess={() => router.push(`/services/${id}`)}
            onCancel={() => router.push(`/services/${id}`)}
          />
        </div>
      )}
    </div>
  );
}
