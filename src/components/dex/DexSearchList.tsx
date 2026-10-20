'use client';

import { useMemo, useRef } from 'react';
import { useScrollToSelected } from '@/hooks/useScrollToSelected';
import { scrollSfxProps } from '@/lib/sfx';
import { capitalize } from '@/lib/transforms';
import type { Pokemon } from '@/lib/types';
import { DexEntry } from '@/components/ui/DexEntry';

interface DexSearchListProps {
  entries: Pokemon[];
  types: string[];
  query: string;
  type: string | null;
  selectedId: number;
  onQuery: (query: string) => void;
  onType: (type: string | null) => void;
  onSelect: (id: number) => void;
}

/** The device's entry list: search by name or number, filter by type. */
export function DexSearchList({ entries, types, query, type, selectedId, onQuery, onType, onSelect }: DexSearchListProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  useScrollToSelected(boxRef, selectedId);
  const scrollSfx = useMemo(scrollSfxProps, []);

  return (
    <section className="dex-search" aria-label="Entry list">
      <div className="dex-search__controls">
        <label className="dex-search__field dex-search__field--search">
          Search
          <input
            type="search"
            className="dex-search__input"
            value={query}
            placeholder="Name or number"
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
        <label className="dex-search__field dex-search__field--type">
          Type
          <select
            className="dex-search__input"
            value={type ?? ''}
            onChange={(e) => onType(e.target.value || null)}
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {capitalize(t)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="dex-search__meta">
        {/* Announced as the filter changes, so screen readers hear the result count */}
        <span role="status">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </span>
        <span>Tap to scan</span>
      </div>

      <div ref={boxRef} className="dex-search__box" {...scrollSfx}>
        {entries.length === 0 && <p className="dex-search__empty">No entries match. Try another name or clear the type.</p>}
        <ul className="dex-search__entries">
          {entries.map((p) => (
            <li key={p.id}>
              <DexEntry pokemon={p} selected={p.id === selectedId} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
