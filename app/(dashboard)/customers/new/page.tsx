"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerForm } from "@/components/customers";

export default function NewCustomerPage() {
  const router = useRouter();

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
          <span className="text-foreground-secondary">New customer</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          New customer
        </h1>
      </div>

      <div className="px-5 py-6 sm:px-6 lg:px-8">
        <CustomerForm
          mode="create"
          onSuccess={() => router.push("/customers")}
          onCancel={() => router.push("/customers")}
        />
      </div>
    </div>
  );
}
