'use client';

import { useRef } from 'react';
import { useScrollToSelected } from '@/hooks/useScrollToSelected';
import { capitalize } from '@/lib/transforms';
import type { Pokemon } from '@/lib/types';
import { DexEntry } from './ui/DexEntry';

interface DexListProps {
  pokemon: Pokemon[];
  highlight: string | null;
  highlightCount: number;
  selectedId: number;
  onSelect: (id: number) => void;
}

export function DexList({ pokemon, highlight, highlightCount, selectedId, onSelect }: DexListProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  // When the selection changes from elsewhere (scatter click, ◀ ▶), keep it in view.
  useScrollToSelected(screenRef, selectedId);

  return (
    <aside className="dex-list" aria-label="Dex list">
      <div className="dex-list__header">
        <h2 className="dex-list__title">Dex list</h2>
        <span className="dex-list__count">
          {highlight ? `${highlightCount} ${capitalize(highlight)}` : `${pokemon.length} entries`}
        </span>
      </div>
      <div ref={screenRef} className="dex-list__screen">
        <ul className="dex-list__entries">
          {pokemon.map((p) => {
            const isSelected = p.id === selectedId;
            return (
              <li key={p.id}>
                <DexEntry
                  pokemon={p}
                  selected={isSelected}
                  dimmed={highlight !== null && p.primaryType !== highlight && !isSelected}
                  onSelect={onSelect}
                />
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
