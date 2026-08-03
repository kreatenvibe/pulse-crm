import type { ID } from "@/types/common";

export function now(): Date {
  return new Date();
}

/** Next sequential id like `lead-051` from existing `lead-001`… rows. */
export function nextId(prefix: string, rows: { id: ID }[]): ID {
  let max = 0;
  for (const row of rows) {
    const match = row.id.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}
