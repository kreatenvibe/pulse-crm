"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import type { ServiceDto } from "@/types/service";

const EMPTY_SERVICES: ServiceDto[] = [];

export function useServices() {
  return useApiQuery<ServiceDto[]>(
    "/api/services",
    EMPTY_SERVICES,
    "Could not load services. Please try again.",
  );
}
