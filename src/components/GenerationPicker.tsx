'use client';

import Link, { useLinkStatus } from 'next/link';
import { GENERATIONS, generationSize, type Generation } from '@/lib/generations';
import { Spinner } from './ui/Spinner';

// Links, not buttons: each generation is a real URL, so it can be bookmarked,
// shared, opened in a new tab, and prefetched by Next.js.
export function GenerationPicker({ current }: { current: Generation }) {
  return (
    <nav className="generation-picker" aria-label="Generation">
      <span className="generation-picker__label">Generation</span>
      <ul className="generation-picker__list">
        {GENERATIONS.map((g) => {
          const isActive = g.id === current.id;
          return (
            <li key={g.id}>
              <Link
                href={`/generation/${g.id}`}
                className={`generation-picker__option${isActive ? ' generation-picker__option--active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                scroll={false}
              >
                <span className="generation-picker__numeral">{g.numeral}</span>
                <span className="generation-picker__region">{g.region}</span>
                <OptionStatus generation={g} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * useLinkStatus only works inside a <Link>: it reports whether *this* link's
 * navigation is still waiting on the server. While it is, swap the count for
 * a spinner. The Sass uses :has(.generation-picker__pending) to dim the charts.
 */
function OptionStatus({ generation }: { generation: Generation }) {
  const { pending } = useLinkStatus();

  if (pending) {
    return (
      <span className="generation-picker__count generation-picker__pending">
        <Spinner size="small" label={`Loading Generation ${generation.numeral}`} />
      </span>
    );
  }
  return <span className="generation-picker__count">{generationSize(generation)}</span>;
}
