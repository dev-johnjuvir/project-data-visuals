import { max, range } from 'd3';
import { useMemo } from 'react';
import { formatDexNumber, formatName } from '@/lib/transforms';
import { pct, typeStyle } from '@/lib/style';
import type { Pokemon } from '@/lib/types';

// Lesson: a scatter plot shows how two measures relate. Here each dot is a
// real <button> positioned with percentages instead of an SVG circle:
//  - it renders on the server at any width, no measuring needed;
//  - every dot is focusable and announced, so the chart works by keyboard.
// The axes always start at 0 and round up to a clean step, so a generation
// with a 230-defense outlier (Shuckle) still fits.

const X_STEP = 25;
const Y_STEP = 50;

interface AttackDefenseScatterProps {
  pokemon: Pokemon[];
  highlight: string | null;
  selected: Pokemon;
  onSelect: (id: number) => void;
}

export function AttackDefenseScatter({ pokemon, highlight, selected, onSelect }: AttackDefenseScatterProps) {
  const xMax = Math.max(150, Math.ceil((max(pokemon, (p) => p.stats.attack) ?? 0) / X_STEP) * X_STEP);
  const yMax = Math.max(200, Math.ceil((max(pokemon, (p) => p.stats.defense) ?? 0) / Y_STEP) * Y_STEP);
  const x = (attack: number) => attack / xMax;
  const y = (defense: number) => 1 - defense / yMax;

  // Paint order = stacking order: dimmed dots first, the selected one last.
  const ordered = useMemo(() => {
    const isLit = (p: Pokemon) => highlight === null || p.primaryType === highlight;
    const rest = pokemon.filter((p) => p.id !== selected.id).sort((a, b) => Number(isLit(a)) - Number(isLit(b)));
    return [...rest, selected];
  }, [pokemon, highlight, selected]);

  const tagFlips = x(selected.stats.attack) > 0.75;

  return (
    <div className="scatter">
      <div className="scatter__plot">
        {range(0, yMax + 1, Y_STEP).map((v) => (
          <div key={`y${v}`} className="scatter__gridline" style={{ bottom: pct(v / yMax) }} aria-hidden="true">
            <span className="scatter__tick scatter__tick--y">{v}</span>
          </div>
        ))}
        {range(0, xMax + 1, X_STEP).map((v) => (
          <span key={`x${v}`} className="scatter__tick scatter__tick--x" style={{ left: pct(v / xMax) }} aria-hidden="true">
            {v}
          </span>
        ))}

        {ordered.map((p) => {
          const isSelected = p.id === selected.id;
          const isLit = highlight === null || p.primaryType === highlight;
          const label = `${formatDexNumber(p.id)} ${formatName(p.name)}, Attack ${p.stats.attack}, Defense ${p.stats.defense}`;
          const modifiers = [
            isSelected && 'scatter__dot--selected',
            !isSelected && !isLit && 'scatter__dot--dimmed',
            !isSelected && isLit && highlight !== null && 'scatter__dot--lit',
          ].filter(Boolean);
          return (
            <button
              key={p.id}
              type="button"
              className={['scatter__dot', ...modifiers].join(' ')}
              style={typeStyle(p.primaryType, { left: pct(x(p.stats.attack)), top: pct(y(p.stats.defense)) })}
              aria-label={label}
              aria-pressed={isSelected}
              title={label}
              onClick={() => onSelect(p.id)}
            />
          );
        })}

        <div
          className={`scatter__tag${tagFlips ? ' scatter__tag--flip' : ''}`}
          style={{ left: pct(x(selected.stats.attack)), top: pct(y(selected.stats.defense)) }}
          aria-hidden="true"
        >
          {formatName(selected.name)}
        </div>

        <span className="scatter__axis-title scatter__axis-title--x">Attack</span>
        <span className="scatter__axis-title scatter__axis-title--y">Defense</span>
      </div>
    </div>
  );
}
