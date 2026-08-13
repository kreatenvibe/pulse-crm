"use client";

import { useEffect, useState } from "react";
import { api, toErrorMessage } from "@/lib/api";
import type { LeadStatus } from "@/types/lead";
import type { LeadDetailsDto } from "@/types/lead-details";

type UseLeadDetailsResult = {
  data: LeadDetailsDto | null;
  loading: boolean;
  error: string | null;
  actionError: string | null;
  actionLoading: boolean;
  refresh: () => void;
  changeStatus: (status: LeadStatus) => Promise<boolean>;
  addNote: (content: string) => Promise<boolean>;
  scheduleAppointment: (input: {
    title: string;
    start: string;
    end: string;
  }) => Promise<boolean>;
  convertLead: () => Promise<boolean>;
};

export function useLeadDetails(id: string): UseLeadDetailsResult {
  const [data, setData] = useState<LeadDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await api.get<LeadDetailsDto>(
          `/api/leads/${id}/details`,
        );
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            toErrorMessage(err, "Could not load lead details. Please try again."),
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

  const refresh = () => setReloadKey((key) => key + 1);

  async function runAction(action: () => Promise<void>): Promise<boolean> {
    setActionLoading(true);
    setActionError(null);

    try {
      await action();
      refresh();
      return true;
    } catch (err) {
      setActionError(toErrorMessage(err, "Action failed. Please try again."));
      return false;
    } finally {
      setActionLoading(false);
    }
  }

  return {
    data,
    loading,
    error,
    actionError,
    actionLoading,
    refresh,
    changeStatus: (status) =>
      runAction(async () => {
        await api.patch(`/api/leads/${id}`, { status });
      }),
    addNote: (content) =>
      runAction(async () => {
        if (!data) throw new Error("Lead not loaded");
        await api.post("/api/notes", {
          entityType: "lead",
          entityId: id,
          content,
          createdBy: data.lead.assignedTo,
        });
      }),
    scheduleAppointment: (input) =>
      runAction(async () => {
        if (!data) throw new Error("Lead not loaded");
        await api.post("/api/appointments", {
          leadId: id,
          title: input.title,
          start: input.start,
          end: input.end,
          status: "scheduled",
          assignedTo: data.lead.assignedTo,
        });
      }),
    convertLead: () =>
      runAction(async () => {
        await api.post(`/api/leads/${id}/convert`);
      }),
  };
}
