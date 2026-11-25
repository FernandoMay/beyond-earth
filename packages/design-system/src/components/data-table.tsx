import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getKey,
  empty = 'No records.',
  caption,
}: {
  columns: Array<Column<T>>;
  rows: T[];
  getKey: (row: T) => string;
  empty?: string;
  caption?: string;
}) {
  return (
    <div className="ar-table-wrap">
      <table className="ar-table">
        {caption && <caption className="ar-sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={column.width ? { width: column.width } : undefined}
                className={column.align ? `is-${column.align}` : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="ar-table__empty">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getKey(row)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.align ? `is-${column.align}` : undefined}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
