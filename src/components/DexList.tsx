'use client';

import { useEffect, useRef } from 'react';
import { capitalize, formatDexNumber, formatName } from '@/lib/transforms';
import type { Pokemon } from '@/lib/types';
import { TypeDot } from './ui/TypeDot';

interface DexListProps {
  pokemon: Pokemon[];
  highlight: string | null;
  highlightCount: number;
  selectedId: number;
  onSelect: (id: number) => void;
}

export function DexList({ pokemon, highlight, highlightCount, selectedId, onSelect }: DexListProps) {
  const screenRef = useRef<HTMLDivElement>(null);

  // When the selection changes from elsewhere (scatter click, prev/next),
  // scroll the list - and only the list, never the page - to show it.
  useEffect(() => {
    const screen = screenRef.current;
    const entry = screen?.querySelector<HTMLElement>(`[data-id="${selectedId}"]`);
    if (!screen || !entry) return;
    const top = entry.offsetTop;
    const bottom = top + entry.offsetHeight;
    if (top < screen.scrollTop) screen.scrollTop = top - 8;
    else if (bottom > screen.scrollTop + screen.clientHeight) screen.scrollTop = bottom - screen.clientHeight + 8;
  }, [selectedId]);

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
            const isDimmed = highlight !== null && p.primaryType !== highlight && !isSelected;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  data-id={p.id}
                  className={`dex-list__entry${isSelected ? ' dex-list__entry--selected' : ''}${
                    isDimmed ? ' dex-list__entry--dimmed' : ''
                  }`}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(p.id)}
                >
                  <span className="dex-list__caret" aria-hidden="true">
                    {isSelected ? '▶' : ''}
                  </span>
                  <span className="dex-list__number">{formatDexNumber(p.id)}</span>
                  <span className="dex-list__name">{formatName(p.name)}</span>
                  <TypeDot type={p.primaryType} size="small" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
