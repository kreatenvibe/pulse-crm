/** Build a Date from an ISO-like local string (IST-friendly). */
export function d(iso: string): Date {
  return new Date(iso);
}

export function pad(n: number, width = 3): string {
  return String(n).padStart(width, "0");
}
