'use client';

import { useId, useState, type ReactNode } from 'react';
import { DataTable, type TableData } from './DataTable';

interface PanelProps {
  /** Readout number shown in the red badge, e.g. "01". */
  number: string;
  title: string;
  description?: ReactNode;
  /** Always shown, above the chart/table (e.g. the scanner card). */
  intro?: ReactNode;
  chart: ReactNode;
  /** When given, the panel gets a Chart / Table toggle. */
  table?: TableData;
  /** Spans the full width of the grid. */
  wide?: boolean;
}

type View = 'chart' | 'table';

export function Panel({ number, title, description, intro, chart, table, wide }: PanelProps) {
  const [view, setView] = useState<View>('chart');
  const headingId = useId();

  return (
    <section className={`panel${wide ? ' panel--wide' : ''}`} aria-labelledby={headingId}>
      <header className="panel__header">
        <div className="panel__heading">
          <span className="panel__number">{number}</span>
          <h2 id={headingId} className="panel__title">
            {title}
          </h2>
        </div>
        {table && (
          <div className="view-toggle" role="group" aria-label="View">
            {(['chart', 'table'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`view-toggle__button${view === option ? ' view-toggle__button--active' : ''}`}
                aria-pressed={view === option}
                onClick={() => setView(option)}
              >
                {option === 'chart' ? 'Chart' : 'Table'}
              </button>
            ))}
          </div>
        )}
      </header>

      {description && <p className="panel__description">{description}</p>}
      {intro}
      {view === 'table' && table ? <DataTable caption={title} {...table} /> : chart}
    </section>
  );
}
