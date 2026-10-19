import { formatDexNumber, formatName } from '@/lib/transforms';
import type { Pokemon } from '@/lib/types';
import { TypeDot } from './TypeDot';

interface DexEntryProps {
  pokemon: Pokemon;
  selected: boolean;
  dimmed?: boolean;
  onSelect: (id: number) => void;
}

/** One row of a Pokédex list: ▶ caret, number, name, type dot. */
export function DexEntry({ pokemon, selected, dimmed, onSelect }: DexEntryProps) {
  return (
    <button
      type="button"
      data-id={pokemon.id}
      className={`dex-entry${selected ? ' dex-entry--selected' : ''}${dimmed ? ' dex-entry--dimmed' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(pokemon.id)}
    >
      <span className="dex-entry__caret" aria-hidden="true">
        {selected ? '▶' : ''}
      </span>
      <span className="dex-entry__number">{formatDexNumber(pokemon.id)}</span>
      <span className="dex-entry__name">{formatName(pokemon.name)}</span>
      <TypeDot type={pokemon.primaryType} size="small" />
    </button>
  );
}
