"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import type { InvoiceDto } from "@/types/invoice";

const EMPTY_INVOICES: InvoiceDto[] = [];

export function useInvoices() {
  return useApiQuery<InvoiceDto[]>(
    "/api/invoices",
    EMPTY_INVOICES,
    "Could not load invoices. Please try again.",
  );
}
