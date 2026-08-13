"use client";

import { useEffect, useState } from "react";
import { api, toErrorMessage } from "@/lib/api";
import type { CustomerDetailsDto } from "@/types/customer-details";

type UseCustomerDetailsResult = {
  data: CustomerDetailsDto | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

export function useCustomerDetails(id: string): UseCustomerDetailsResult {
  const [data, setData] = useState<CustomerDetailsDto | null>(null);
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
        const result = await api.get<CustomerDetailsDto>(
          `/api/customers/${id}/details`,
        );
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            toErrorMessage(
              err,
              "Could not load customer details. Please try again.",
            ),
          );
          setData(null);
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
