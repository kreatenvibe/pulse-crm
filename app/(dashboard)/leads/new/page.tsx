"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LeadForm } from "@/components/leads";

export default function NewLeadPage() {
  const router = useRouter();

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
          <span className="text-foreground-secondary">New lead</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          New lead
        </h1>
      </div>

      <div className="px-5 py-6 sm:px-6 lg:px-8">
        <LeadForm
          mode="create"
          onSuccess={() => router.push("/leads")}
          onCancel={() => router.push("/leads")}
        />
      </div>
    </div>
  );
}
