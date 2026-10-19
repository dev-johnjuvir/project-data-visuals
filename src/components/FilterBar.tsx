'use client';

import type { Generation } from '@/lib/generations';
import { capitalize, formatName } from '@/lib/transforms';
import type { Pokemon } from '@/lib/types';
import { GenerationPicker } from './GenerationPicker';

interface FilterBarProps {
  generation: Generation;
  types: string[];
  pokemon: Pokemon[];
  highlight: string | null;
  selectedId: number;
  onHighlightChange: (type: string | null) => void;
  onSelectedChange: (id: number) => void;
}

/** One filter row above everything it scopes - never filters inside a card. */
export function FilterBar({ generation, types, pokemon, highlight, selectedId, onHighlightChange, onSelectedChange }: FilterBarProps) {
  return (
    <div className="filter-bar" role="search">
      <GenerationPicker current={generation} />

      <label className="filter-bar__field">
        <span className="filter-bar__label">Highlight type</span>
        <select
          className="filter-bar__select"
          value={highlight ?? ''}
          onChange={(e) => onHighlightChange(e.target.value || null)}
        >
          <option value="">All types</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {capitalize(type)}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-bar__field">
        <span className="filter-bar__label">Inspect Pokémon</span>
        <select className="filter-bar__select" value={selectedId} onChange={(e) => onSelectedChange(Number(e.target.value))}>
          {pokemon.map((p) => (
            <option key={p.id} value={p.id}>
              #{String(p.id).padStart(3, '0')} {formatName(p.name)}
            </option>
          ))}
        </select>
      </label>

      {highlight && (
        <button type="button" className="filter-bar__reset" onClick={() => onHighlightChange(null)}>
          Clear highlight
        </button>
      )}
    </div>
  );
}
