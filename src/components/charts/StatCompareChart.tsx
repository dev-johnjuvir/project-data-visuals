import { formatName } from '@/lib/transforms';
import { pct, typeStyle } from '@/lib/style';
import { STAT_KEYS, STAT_LABELS, type Pokemon, type StatKey } from '@/lib/types';

// Lesson: compare one entry against the average with a bar + a marker on a
// shared, FIXED scale. The fill is this Pokémon; the ink tick is the
// generation average. Fixing the scale at 0-255 (the highest possible base
// stat) keeps bar lengths comparable as you flip between Pokémon.

const MAX_STAT = 255;

interface StatCompareChartProps {
  pokemon: Pokemon;
  /** Exact (unrounded) averages, so the tick lands precisely. */
  average: Record<StatKey, number>;
  averageLabel: string;
}

export function StatCompareChart({ pokemon, average, averageLabel }: StatCompareChartProps) {
  return (
    <div className="stat-meter" style={typeStyle(pokemon.primaryType)}>
      {STAT_KEYS.map((key) => {
        const value = pokemon.stats[key];
        const avg = average[key];
        return (
          <div key={key} className="stat-meter__row">
            <span className="stat-meter__label">{STAT_LABELS[key]}</span>
            <div
              className="stat-meter__track"
              role="img"
              aria-label={`${STAT_LABELS[key]}: ${value}, average ${Math.round(avg)}`}
            >
              {/* A 3% minimum keeps very low stats visible as a sliver */}
              <div className="stat-meter__fill" style={{ width: pct(Math.max(0.03, value / MAX_STAT)) }} />
              <div className="stat-meter__tick" style={{ left: pct(avg / MAX_STAT) }} />
            </div>
            <span className="stat-meter__value">
              <b>{value}</b> / {Math.round(avg)}
            </span>
          </div>
        );
      })}

      <div className="stat-meter__legend">
        <span className="stat-meter__key">
          <span className="stat-meter__key-fill" aria-hidden="true" />
          {formatName(pokemon.name)}
        </span>
        <span className="stat-meter__key">
          <span className="stat-meter__key-tick" aria-hidden="true" />
          {averageLabel}
        </span>
        <span>Scale 0 to {MAX_STAT}</span>
      </div>
    </div>
  );
}
