import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  data: T[];
  getRowId: (row: T) => string;
};

export function DataTable<T>({ columns, data, getRowId }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded border border-zinc-200">
      <table className="min-w-full border-collapse text-left">
        <thead className="border-b border-zinc-200 bg-zinc-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.id}
                className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-zinc-600"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={getRowId(row)}
              className="border-b border-zinc-200 last:border-b-0"
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  className="px-3 py-2 text-sm whitespace-nowrap"
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
