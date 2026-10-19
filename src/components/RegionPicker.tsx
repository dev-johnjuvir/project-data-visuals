'use client';

import Link, { useLinkStatus } from 'next/link';
import { GENERATIONS, type Generation } from '@/lib/generations';
import { Spinner } from './ui/Spinner';

// Links, not buttons: each generation is a real URL, so it can be bookmarked,
// shared, opened in a new tab, and prefetched by Next.js.
export function RegionPicker({ current }: { current: Generation }) {
  return (
    <div className="region-picker">
      <span className="region-picker__label">Select region</span>
      <nav className="region-picker__list" aria-label="Generation">
        {GENERATIONS.map((g) => {
          const isActive = g.id === current.id;
          return (
            <Link
              key={g.id}
              href={`/generation/${g.id}`}
              className={`region-picker__option${isActive ? ' region-picker__option--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              scroll={false}
            >
              <span className="region-picker__numeral">{g.numeral}</span>
              <RegionName generation={g} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * useLinkStatus only works inside a <Link>: it reports whether *this* link's
 * navigation is still waiting on the server. While it is, the region name
 * becomes a spinner, and the Sass uses :has(.region-picker__pending) to dim
 * the dashboard.
 */
function RegionName({ generation }: { generation: Generation }) {
  const { pending } = useLinkStatus();
  if (pending) {
    return (
      <span className="region-picker__region region-picker__pending">
        <Spinner size="small" label={`Loading Generation ${generation.numeral}`} />
      </span>
    );
  }
  return <span className="region-picker__region">{generation.region}</span>;
}
