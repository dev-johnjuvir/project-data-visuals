'use client';

import { useState, type ReactNode } from 'react';
import { DataTable, type Column, type Row } from './DataTable';

interface ChartCardProps {
  title: string;
  description: string;
  /** Rendered between the header and the plot. */
  legend?: ReactNode;
  table: { columns: Column[]; rows: Row[] };
  /** Extra BEM modifier, e.g. "wide" -> chart-card--wide. */
  modifier?: string;
  children: ReactNode;
}

type View = 'chart' | 'table';

export function ChartCard({ title, description, legend, table, modifier, children }: ChartCardProps) {
  const [view, setView] = useState<View>('chart');

  return (
    <section className={`chart-card${modifier ? ` chart-card--${modifier}` : ''}`} aria-label={title}>
      <header className="chart-card__header">
        <div className="chart-card__heading">
          <h2 className="chart-card__title">{title}</h2>
          <p className="chart-card__description">{description}</p>
        </div>
        <div className="chart-card__toggle" role="group" aria-label="View as">
          {(['chart', 'table'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={`chart-card__toggle-button${view === option ? ' chart-card__toggle-button--active' : ''}`}
              aria-pressed={view === option}
              onClick={() => setView(option)}
            >
              {option === 'chart' ? 'Chart' : 'Table'}
            </button>
          ))}
        </div>
      </header>

      {view === 'chart' ? (
        <>
          {legend}
          <div className="chart-card__body">{children}</div>
        </>
      ) : (
        <div className="chart-card__body chart-card__body--table">
          <DataTable caption={title} columns={table.columns} rows={table.rows} />
        </div>
      )}
    </section>
  );
}
