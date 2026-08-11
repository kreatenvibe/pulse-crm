"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ServiceForm } from "@/components/services";

export default function NewServicePage() {
  const router = useRouter();

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
          <span className="text-foreground-secondary">New service</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          New service
        </h1>
      </div>

      <div className="px-5 py-6 sm:px-6 lg:px-8">
        <ServiceForm
          mode="create"
          onSuccess={() => router.push("/services")}
          onCancel={() => router.push("/services")}
        />
      </div>
    </div>
  );
}
