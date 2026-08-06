import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Right-align numeric or action columns. */
  align?: "left" | "right";
  /** Soften secondary columns (muted body text). */
  muted?: boolean;
  /** Extra classes on header and body cells for this column. */
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
  /** Optional row selection highlight (caller-owned). */
  isRowSelected?: (row: T) => boolean;
};

export function DataTable<T>({
  columns,
  data,
  getRowId,
  isRowSelected,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={[
                  "px-4 py-3 text-[11px] font-medium tracking-[0.06em] text-foreground-muted uppercase",
                  column.align === "right" ? "text-right" : "text-left",
                  column.className,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const selected = isRowSelected?.(row) ?? false;
            return (
              <tr
                key={getRowId(row)}
                data-selected={selected ? "true" : undefined}
                className={
                  selected
                    ? "border-b border-border bg-brand-soft/50"
                    : "border-b border-border bg-surface transition-colors last:border-b-0 hover:bg-surface-muted/60"
                }
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={[
                      "px-4 py-4 align-middle",
                      column.align === "right" ? "text-right" : "text-left",
                      column.muted
                        ? "text-foreground-secondary"
                        : "text-foreground",
                      column.className,
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
