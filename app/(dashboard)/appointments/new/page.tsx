"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppointmentForm } from "@/components/appointments";

export default function NewAppointmentPage() {
  const router = useRouter();

  return (
    <div className="flex w-full flex-col">
      <div className="border-b border-border px-5 py-5 sm:px-6 lg:px-8">
        <p className="text-sm text-foreground-muted">
          <Link
            href="/appointments"
            className="text-brand hover:text-brand-hover hover:underline"
          >
            Appointments
          </Link>
          <span className="mx-1.5 text-foreground-muted">/</span>
          <span className="text-foreground-secondary">New appointment</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          New appointment
        </h1>
      </div>

      <div className="px-5 py-6 sm:px-6 lg:px-8">
        <AppointmentForm
          mode="create"
          onSuccess={() => router.push("/appointments")}
          onCancel={() => router.push("/appointments")}
        />
      </div>
    </div>
  );
}
