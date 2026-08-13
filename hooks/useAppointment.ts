"use client";

import { useEffect, useState } from "react";
import { ApiError, api, toErrorMessage } from "@/lib/api";
import type { AppointmentDto } from "@/types/appointment";

type UseAppointmentResult = {
  data: AppointmentDto | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

/** Fetch a single appointment by id (GET /api/appointments/[id]). */
export function useAppointment(id: string): UseAppointmentResult {
  const [data, setData] = useState<AppointmentDto | null>(null);
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
        const result = await api.get<AppointmentDto>(`/api/appointments/${id}`);
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
              toErrorMessage(
                err,
                "Could not load appointment. Please try again.",
              ),
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
