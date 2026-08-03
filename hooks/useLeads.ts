"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import type { LeadDto } from "@/types/lead";

const EMPTY_LEADS: LeadDto[] = [];

export function useLeads() {
  return useApiQuery<LeadDto[]>(
    "/api/leads",
    EMPTY_LEADS,
    "Could not load leads. Please try again.",
  );
}
