export interface Column {
  key: string;
  label: string;
  numeric?: boolean;
}

export type Row = Record<string, string | number>;

export interface TableData {
  columns: Column[];
  rows: Row[];
  /** Optional summary row, e.g. a total. */
  footer?: Row;
}

/** The table twin of a chart: the accessible way to read exact values. */
export function DataTable({ caption, columns, rows, footer }: TableData & { caption: string }) {
  const cellClass = (base: string, col: Column) => `${base}${col.numeric ? ` ${base}--numeric` : ''}`;

  return (
    <div className="data-table">
      <table className="data-table__table">
        <caption className="data-table__caption">{caption}</caption>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cellClass('data-table__head', col)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="data-table__row">
              {columns.map((col) => (
                <td key={col.key} className={cellClass('data-table__cell', col)}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {footer && (
            <tr className="data-table__row data-table__row--total">
              {columns.map((col) => (
                <td key={col.key} className={cellClass('data-table__cell', col)}>
                  {footer[col.key]}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
