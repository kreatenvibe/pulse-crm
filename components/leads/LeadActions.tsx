"use client";

import { useEffect, useState } from "react";
import { Button, SelectFilter } from "@/components/ui";
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

const inputClassName =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow] hover:border-border-strong focus:border-brand focus:ring-2 focus:ring-focus-ring disabled:opacity-40";

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
    <section className="border border-border bg-surface lg:sticky lg:top-6 lg:self-start">
      <div className="border-b border-border px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold text-foreground">Actions</h2>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Update this lead without leaving the page.
        </p>
      </div>

      <div className="space-y-6 px-5 py-5 sm:px-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Change status</p>
          <div className="flex flex-wrap items-end gap-2">
            <SelectFilter
              id="lead-status-action"
              label="Change status"
              hideLabel
              value={status}
              options={LEAD_STATUSES.map((item) => ({
                value: item,
                label: formatLabel(item),
              }))}
              onChange={(value) => setStatus(value as LeadStatus)}
              disabled={actionLoading}
              className="min-w-40 flex-1"
            />
            <Button
              size="sm"
              variant="primary"
              disabled={actionLoading || status === currentStatus}
              onClick={() => void handleStatusSave()}
            >
              Save status
            </Button>
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-6">
          <label
            htmlFor="lead-note"
            className="text-sm font-medium text-foreground"
          >
            Add note
          </label>
          <textarea
            id="lead-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={actionLoading}
            placeholder="Call summary, next steps, etc."
            className={inputClassName}
          />
          <Button
            size="sm"
            disabled={actionLoading}
            onClick={() => void handleAddNote()}
          >
            Add note
          </Button>
        </div>

        <div className="space-y-2 border-t border-border pt-6">
          <p className="text-sm font-medium text-foreground">
            Schedule appointment
          </p>
          <input
            type="text"
            value={appointmentTitle}
            onChange={(event) => setAppointmentTitle(event.target.value)}
            disabled={actionLoading}
            placeholder="Title"
            className={inputClassName}
          />
          <div className="grid gap-2">
            <label className="flex flex-col gap-1 text-xs text-foreground-muted">
              Start
              <input
                type="datetime-local"
                value={appointmentStart}
                onChange={(event) => setAppointmentStart(event.target.value)}
                disabled={actionLoading}
                className={inputClassName}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-foreground-muted">
              End
              <input
                type="datetime-local"
                value={appointmentEnd}
                onChange={(event) => setAppointmentEnd(event.target.value)}
                disabled={actionLoading}
                className={inputClassName}
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

        <div className="space-y-2 border-t border-border pt-6">
          <p className="text-sm font-medium text-foreground">Convert lead</p>
          <p className="text-xs text-foreground-muted">
            Creates a customer from this lead and marks status as converted.
          </p>
          <Button
            size="sm"
            variant="outline-brand"
            disabled={actionLoading || isConverted}
            onClick={() => void handleConvert()}
          >
            {isConverted ? "Already converted" : "Convert to customer"}
          </Button>
        </div>

        {actionError ? (
          <p className="text-sm text-danger">{actionError}</p>
        ) : null}
        {message ? (
          <p className="text-sm text-foreground-secondary">{message}</p>
        ) : null}
      </div>
    </section>
  );
}
