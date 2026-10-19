import { extent, interpolateRgb } from 'd3';
import { capitalize, type TypeStatRow } from '@/lib/transforms';
import { STAT_KEYS, STAT_LABELS } from '@/lib/types';
import { TypeDot } from '@/components/ui/TypeDot';

// Lesson: a heatmap encodes magnitude as color across a grid of two
// categories. For magnitude, use ONE hue from light to dark - never a
// rainbow - and always show the scale. The cell text flips to white once
// the background gets dark enough that ink would stop being readable.

const LOW = '#eef3f7';
const HIGH = '#123054';
const WHITE_TEXT_FROM = 0.58;
const ramp = interpolateRgb(LOW, HIGH);

interface TypeStatHeatmapProps {
  rows: TypeStatRow[];
  highlight: string | null;
  onToggle: (type: string) => void;
}

export function TypeStatHeatmap({ rows, highlight, onToggle }: TypeStatHeatmapProps) {
  const [lo, hi] = extent(rows.flatMap((r) => STAT_KEYS.map((k) => r.values[k]))) as [number, number];
  const position = (v: number) => (hi === lo ? 0 : (v - lo) / (hi - lo));

  return (
    <div className="heatmap">
      <div className="heatmap__screen">
        <div className="heatmap__grid">
          <div className="heatmap__row heatmap__row--head">
            <span />
            {STAT_KEYS.map((key) => (
              <span key={key} className="heatmap__column-label">
                {STAT_LABELS[key]}
              </span>
            ))}
          </div>

          {rows.map((row) => {
            const isActive = highlight === row.type;
            const isDimmed = highlight !== null && !isActive;
            return (
              <div key={row.type} className={`heatmap__row${isDimmed ? ' heatmap__row--dimmed' : ''}`}>
                <button
                  type="button"
                  className={`heatmap__type${isActive ? ' heatmap__type--active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => onToggle(row.type)}
                >
                  <TypeDot type={row.type} size="small" />
                  {capitalize(row.type)}
                </button>
                {STAT_KEYS.map((key) => {
                  const v = row.values[key];
                  const t = position(v);
                  return (
                    <span
                      key={key}
                      className={`heatmap__cell${t > WHITE_TEXT_FROM ? ' heatmap__cell--dark' : ''}`}
                      style={{ background: ramp(t) }}
                      title={`${capitalize(row.type)} · ${STAT_LABELS[key]}: ${v}`}
                    >
                      {v}
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* A sequential scale always needs its key: which color means how much */}
      <div className="heatmap__legend">
        <span>Average base stat</span>
        <b className="heatmap__legend-value">{lo}</b>
        <span className="heatmap__ramp" style={{ background: `linear-gradient(90deg, ${LOW}, ${HIGH})` }} aria-hidden="true" />
        <b className="heatmap__legend-value">{hi}</b>
      </div>
    </div>
  );
}
