"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { LeadForm } from "@/components/leads";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useLeadDetails } from "@/hooks";

export default function EditLeadPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { data, loading, error } = useLeadDetails(id);

  return (
    <div className="flex w-full flex-col">
      <div className="border-b border-border px-5 py-5 sm:px-6 lg:px-8">
        <p className="text-sm text-foreground-muted">
          <Link
            href="/leads"
            className="text-brand hover:text-brand-hover hover:underline"
          >
            Leads
          </Link>
          <span className="mx-1.5 text-foreground-muted">/</span>
          <Link
            href={`/leads/${id}`}
            className="text-brand hover:text-brand-hover hover:underline"
          >
            {data?.lead.name ?? id}
          </Link>
          <span className="mx-1.5 text-foreground-muted">/</span>
          <span className="text-foreground-secondary">Edit</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Edit lead
        </h1>
      </div>

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading lead…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : !data ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <EmptyState message="Lead not found." />
        </div>
      ) : (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LeadForm
            mode="edit"
            lead={data.lead}
            onSuccess={() => router.push(`/leads/${id}`)}
            onCancel={() => router.push(`/leads/${id}`)}
          />
        </div>
      )}
    </div>
  );
}
