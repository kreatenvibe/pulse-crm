export function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Format a monetary amount stored as integer cents into a currency string.
 * `currency` is a free-text ISO-ish code (e.g. "INR", "USD"); if it is not a
 * valid Intl currency, fall back to a plain "<code> <major>.<cents>" rendering.
 *
 * By default the currency's natural fraction digits are used (e.g. paise for
 * INR). Pass `maximumFractionDigits: 0` for whole-unit rendering (summary KPIs
 * and compact lists).
 */
export function formatMoney(
  amountCents: number,
  currency: string,
  options?: { maximumFractionDigits?: number },
): string {
  const major = amountCents / 100;
  const { maximumFractionDigits } = options ?? {};
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      ...(maximumFractionDigits !== undefined ? { maximumFractionDigits } : {}),
    }).format(major);
  } catch {
    return `${currency} ${major.toFixed(maximumFractionDigits ?? 2)}`;
  }
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTimeRange(
  start?: string | null,
  end?: string | null,
): string {
  if (!start) return "—";
  if (!end) return formatTime(start);
  return `${formatTime(start)} – ${formatTime(end)}`;
}

export function formatRelativeTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = date.getTime() - Date.now();
  const absMs = Math.abs(diffMs);
  const minutes = Math.round(absMs / 60_000);
  const hours = Math.round(absMs / 3_600_000);
  const days = Math.round(absMs / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (minutes < 1) return "just now";
  if (minutes < 60) return rtf.format(Math.sign(diffMs) * minutes, "minute");
  if (hours < 24) return rtf.format(Math.sign(diffMs) * hours, "hour");
  if (days < 30) return rtf.format(Math.sign(diffMs) * days, "day");
  return formatDate(value);
}

export function formatGreetingDate(value = new Date()): string {
  return value.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function greetingForHour(hour = new Date().getHours()): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
