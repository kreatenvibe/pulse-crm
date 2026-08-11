"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type { InvoiceDto } from "@/types/invoice";

type UseInvoiceResult = {
  data: InvoiceDto | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Fetch a single invoice by id (GET /api/invoices/[id]). */
export function useInvoice(id: string): UseInvoiceResult {
  const [data, setData] = useState<InvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await api.get<InvoiceDto>(`/api/invoices/${id}`);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          // A 404 is a real "not found", not a load failure — surface it as an
          // empty result so the page can render its not-found state.
          if (err instanceof ApiError && err.status === 404) {
            setData(null);
          } else {
            setError(
              toErrorMessage(err, "Could not load invoice. Please try again."),
            );
            setData(null);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  return {
    data,
    loading,
    error,
    refresh: () => setReloadKey((key) => key + 1),
  };
}
