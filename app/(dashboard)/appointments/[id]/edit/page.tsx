"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppointmentForm } from "@/components/appointments";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui";
import { useAppointment } from "@/hooks";

export default function EditAppointmentPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const { data: appointment, loading, error } = useAppointment(id);

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
          <Link
            href={`/appointments/${id}`}
            className="text-brand hover:text-brand-hover hover:underline"
          >
            {appointment?.title ?? id}
          </Link>
          <span className="mx-1.5 text-foreground-muted">/</span>
          <span className="text-foreground-secondary">Edit</span>
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Edit appointment
        </h1>
      </div>

      {loading ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <LoadingState message="Loading appointment…" />
        </div>
      ) : error ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <ErrorState message={error} />
        </div>
      ) : !appointment ? (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <EmptyState message="Appointment not found." />
        </div>
      ) : (
        <div className="px-5 py-6 sm:px-6 lg:px-8">
          <AppointmentForm
            mode="edit"
            appointment={appointment}
            onSuccess={() => router.push(`/appointments/${id}`)}
            onCancel={() => router.push(`/appointments/${id}`)}
          />
        </div>
      )}
    </div>
  );
}
