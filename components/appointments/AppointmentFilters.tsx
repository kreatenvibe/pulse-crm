"use client";

import { Button, SelectFilter } from "@/components/ui";
import { formatLabel } from "@/lib/format";
import type { AppointmentStatus } from "@/types/appointment";
import {
  APPOINTMENT_STATUSES,
  formatMonthLabel,
  shiftMonth,
  type ViewMode,
} from "./utils";

type AppointmentFiltersProps = {
  viewMode: ViewMode;
  status: AppointmentStatus | "";
  month: Date;
  onViewModeChange: (value: ViewMode) => void;
  onStatusChange: (value: AppointmentStatus | "") => void;
  onMonthChange: (month: Date) => void;
};

export function AppointmentFilters({
  viewMode,
  status,
  month,
  onViewModeChange,
  onStatusChange,
  onMonthChange,
}: AppointmentFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <SelectFilter
          id="appointment-view"
          label="View"
          value={viewMode}
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "month", label: "By month" },
          ]}
          onChange={(value) => onViewModeChange(value as ViewMode)}
        />

        <SelectFilter
          id="appointment-status"
          label="Status"
          value={status}
          allLabel="All statuses"
          options={APPOINTMENT_STATUSES.map((item) => ({
            value: item,
            label: formatLabel(item),
          }))}
          onChange={(value) => onStatusChange(value as AppointmentStatus | "")}
        />
      </div>

      {viewMode === "month" ? (
        <div className="flex items-center gap-3 border-t border-border pt-3">
          <Button
            type="button"
            size="sm"
            onClick={() => onMonthChange(shiftMonth(month, -1))}
          >
            Previous
          </Button>
          <p className="min-w-40 text-center text-sm font-medium text-foreground">
            {formatMonthLabel(month)}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => onMonthChange(shiftMonth(month, 1))}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
