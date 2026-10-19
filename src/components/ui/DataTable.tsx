export interface Column {
  key: string;
  label: string;
  numeric?: boolean;
}

export type Row = Record<string, string | number>;

interface DataTableProps {
  caption: string;
  columns: Column[];
  rows: Row[];
}

/** The table twin of every chart: the accessible way to read exact values. */
export function DataTable({ caption, columns, rows }: DataTableProps) {
  return (
    <div className="data-table">
      <table className="data-table__table">
        <caption className="data-table__caption">{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`data-table__head${col.numeric ? ' data-table__head--numeric' : ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="data-table__row">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`data-table__cell${col.numeric ? ' data-table__cell--numeric' : ''}`}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
