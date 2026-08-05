"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import type { AppointmentDto } from "@/types/appointment";

const EMPTY_APPOINTMENTS: AppointmentDto[] = [];

export function useAppointments() {
  return useApiQuery<AppointmentDto[]>(
    "/api/appointments",
    EMPTY_APPOINTMENTS,
    "Could not load appointments. Please try again.",
  );
}
