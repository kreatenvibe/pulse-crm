"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { formatLabel } from "@/lib/format";
import type { LeadStatus } from "@/types/lead";
import { LEAD_STATUSES } from "./utils";

type LeadActionsProps = {
  currentStatus: LeadStatus;
  isConverted: boolean;
  actionLoading: boolean;
  actionError: string | null;
  onChangeStatus: (status: LeadStatus) => Promise<boolean>;
  onAddNote: (content: string) => Promise<boolean>;
  onScheduleAppointment: (input: {
    title: string;
    start: string;
    end: string;
  }) => Promise<boolean>;
  onConvertLead: () => Promise<boolean>;
};

function toLocalInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultAppointmentWindow() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);

  const end = new Date(start);
  end.setHours(11, 0, 0, 0);

  return {
    start: toLocalInputValue(start),
    end: toLocalInputValue(end),
  };
}

export function LeadActions({
  currentStatus,
  isConverted,
  actionLoading,
  actionError,
  onChangeStatus,
  onAddNote,
  onScheduleAppointment,
  onConvertLead,
}: LeadActionsProps) {
  const [status, setStatus] = useState<LeadStatus>(currentStatus);
  const [note, setNote] = useState("");
  const [appointmentTitle, setAppointmentTitle] = useState("Discovery call");
  const defaults = defaultAppointmentWindow();
  const [appointmentStart, setAppointmentStart] = useState(defaults.start);
  const [appointmentEnd, setAppointmentEnd] = useState(defaults.end);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  async function handleStatusSave() {
    setMessage(null);
    const ok = await onChangeStatus(status);
    if (ok) setMessage("Status updated.");
  }

  async function handleAddNote() {
    const content = note.trim();
    if (!content) {
      setMessage("Enter a note before saving.");
      return;
    }

    setMessage(null);
    const ok = await onAddNote(content);
    if (ok) {
      setNote("");
      setMessage("Note added.");
    }
  }

  async function handleSchedule() {
    if (!appointmentTitle.trim()) {
      setMessage("Enter an appointment title.");
      return;
    }

    setMessage(null);
    const ok = await onScheduleAppointment({
      title: appointmentTitle.trim(),
      start: appointmentStart,
      end: appointmentEnd,
    });
    if (ok) setMessage("Appointment scheduled.");
  }

  async function handleConvert() {
    setMessage(null);
    const ok = await onConvertLead();
    if (ok) setMessage("Lead converted to customer.");
  }

  return (
    <section className="rounded border border-zinc-200 p-4">
      <h2 className="text-sm font-semibold">Actions</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Update this lead without leaving the page.
      </p>

      <div className="mt-4 space-y-6">
        <div className="space-y-2">
          <label htmlFor="lead-status-action" className="text-sm font-medium">
            Change status
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="lead-status-action"
              value={status}
              onChange={(event) => setStatus(event.target.value as LeadStatus)}
              disabled={actionLoading}
              className="rounded border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500"
            >
              {LEAD_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              disabled={actionLoading || status === currentStatus}
              onClick={() => void handleStatusSave()}
            >
              Save status
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="lead-note" className="text-sm font-medium">
            Add note
          </label>
          <textarea
            id="lead-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={actionLoading}
            placeholder="Call summary, next steps, etc."
            className="w-full rounded border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
          <Button
            size="sm"
            disabled={actionLoading}
            onClick={() => void handleAddNote()}
          >
            Add note
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Schedule appointment</p>
          <input
            type="text"
            value={appointmentTitle}
            onChange={(event) => setAppointmentTitle(event.target.value)}
            disabled={actionLoading}
            placeholder="Title"
            className="w-full rounded border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              Start
              <input
                type="datetime-local"
                value={appointmentStart}
                onChange={(event) => setAppointmentStart(event.target.value)}
                disabled={actionLoading}
                className="rounded border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-zinc-500">
              End
              <input
                type="datetime-local"
                value={appointmentEnd}
                onChange={(event) => setAppointmentEnd(event.target.value)}
                disabled={actionLoading}
                className="rounded border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500"
              />
            </label>
          </div>
          <Button
            size="sm"
            disabled={actionLoading}
            onClick={() => void handleSchedule()}
          >
            Schedule
          </Button>
        </div>

        <div className="space-y-2 border-t border-zinc-200 pt-4">
          <p className="text-sm font-medium">Convert lead</p>
          <p className="text-xs text-zinc-500">
            Creates a customer from this lead and marks status as converted.
          </p>
          <Button
            size="sm"
            disabled={actionLoading || isConverted}
            onClick={() => void handleConvert()}
          >
            {isConverted ? "Already converted" : "Convert to customer"}
          </Button>
        </div>

        {actionError ? (
          <p className="text-sm text-red-600">{actionError}</p>
        ) : null}
        {message ? <p className="text-sm text-zinc-600">{message}</p> : null}
      </div>
    </section>
  );
}
