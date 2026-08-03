"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import type { CustomerDto } from "@/types/customer";

const EMPTY_CUSTOMERS: CustomerDto[] = [];

export function useCustomers() {
  return useApiQuery<CustomerDto[]>(
    "/api/customers",
    EMPTY_CUSTOMERS,
    "Could not load customers. Please try again.",
  );
}
