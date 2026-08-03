"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";

type UseApiQueryResult<T> = {
  data: T;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Minimal GET + refresh helper shared by resource hooks.
 * Pass stable `initialData` (module-level constant) to avoid refetch loops.
 */
export function useApiQuery<T>(
  path: string,
  initialData: T,
  errorFallback: string,
): UseApiQueryResult<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await api.get<T>(path);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(toErrorMessage(err, errorFallback));
          setData(initialData);
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
    // initialData / errorFallback must be stable (module constants / literals).
  }, [path, reloadKey, initialData, errorFallback]);

  return {
    data,
    loading,
    error,
    refresh: () => setReloadKey((key) => key + 1),
  };
}
