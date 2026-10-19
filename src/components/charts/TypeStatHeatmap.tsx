'use client';

import { extent, scaleBand, scaleQuantize } from 'd3';
import { useMemo, useState } from 'react';
import { useElementWidth } from '@/hooks/useElementWidth';
import { capitalize, type TypeStatRow } from '@/lib/transforms';
import { STAT_KEYS, STAT_LABELS, STAT_SHORT_LABELS, type StatKey } from '@/lib/types';
import { ChartSvg } from '@/components/ui/ChartSvg';
import { Tooltip, TooltipRow } from '@/components/ui/Tooltip';

// Lesson: a heatmap encodes magnitude as color across a grid of two
// categories. For magnitude, use ONE hue from light to dark (sequential),
// never a rainbow. We quantize into 7 steps; the step's color lives in Sass
// as a BEM modifier (heatmap__cell--step-3), so light/dark mode can retune it.

const STEPS = 7;
const MARGIN = { top: 28, right: 8, bottom: 8, left: 76 };
const ROW_HEIGHT = 30;
const GAP = 2;

interface TypeStatHeatmapProps {
  rows: TypeStatRow[];
  highlight: string | null;
}

export function TypeStatHeatmap({ rows, highlight }: TypeStatHeatmapProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<{ type: string; stat: StatKey } | null>(null);

  const domain = useMemo(
    () => extent(rows.flatMap((r) => STAT_KEYS.map((k) => r.values[k]))) as [number, number],
    [rows],
  );
  const step = scaleQuantize<number>().domain(domain).range([...Array(STEPS).keys()]);

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const height = MARGIN.top + rows.length * ROW_HEIGHT + MARGIN.bottom;
  const x = scaleBand<StatKey>().domain([...STAT_KEYS]).range([0, innerWidth]);

  const hoveredRow = hovered ? rows.find((r) => r.type === hovered.type) : null;
  const hoveredRowIndex = hoveredRow ? rows.indexOf(hoveredRow) : -1;

  return (
    <div className="heatmap">
      <div ref={ref} className="chart">
        <ChartSvg width={width} height={height} label="Heatmap of average base stats by primary type">
            {STAT_KEYS.map((key) => (
              <text key={key} className="chart__category" x={MARGIN.left + (x(key) ?? 0) + x.bandwidth() / 2} y={MARGIN.top - 10} textAnchor="middle">
                {x.bandwidth() < 64 ? STAT_SHORT_LABELS[key] : STAT_LABELS[key]}
              </text>
            ))}

            {rows.map((row, i) => {
              const y = MARGIN.top + i * ROW_HEIGHT;
              const isDimmed = highlight !== null && row.type !== highlight;
              const isActive = row.type === highlight;
              return (
                <g
                  key={row.type}
                  className={`heatmap__row${isDimmed ? ' heatmap__row--dimmed' : ''}${isActive ? ' heatmap__row--active' : ''}`}
                >
                  <text className="chart__category heatmap__row-label" x={MARGIN.left - 8} y={y + ROW_HEIGHT / 2} dy="0.35em" textAnchor="end">
                    {capitalize(row.type)}
                  </text>
                  {STAT_KEYS.map((key) => {
                    const value = row.values[key];
                    const s = step(value);
                    const cx = MARGIN.left + (x(key) ?? 0);
                    const isHovered = hovered?.type === row.type && hovered.stat === key;
                    return (
                      <g
                        key={key}
                        onMouseEnter={() => setHovered({ type: row.type, stat: key })}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <rect
                          className={`heatmap__cell heatmap__cell--step-${s}${isHovered ? ' heatmap__cell--hovered' : ''}`}
                          x={cx + GAP / 2}
                          y={y + GAP / 2}
                          width={Math.max(0, x.bandwidth() - GAP)}
                          height={ROW_HEIGHT - GAP}
                          rx={3}
                        />
                        <text className={`heatmap__value heatmap__value--step-${s}`} x={cx + x.bandwidth() / 2} y={y + ROW_HEIGHT / 2} dy="0.35em" textAnchor="middle">
                          {value}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
        </ChartSvg>

        {hovered && hoveredRow && (
          <Tooltip
            x={MARGIN.left + (x(hovered.stat) ?? 0) + x.bandwidth()}
            y={MARGIN.top + hoveredRowIndex * ROW_HEIGHT + ROW_HEIGHT / 2}
            containerWidth={width}
          >
            <p className="tooltip__title">
              {capitalize(hoveredRow.type)} · {STAT_LABELS[hovered.stat]}
            </p>
            <TooltipRow label="Average" value={hoveredRow.values[hovered.stat]} />
            <TooltipRow label="Pokémon in type" value={hoveredRow.count} />
          </Tooltip>
        )}
      </div>

      {/* A sequential scale always needs its legend: which color means how much */}
      <div className="heatmap__legend" aria-label="Color scale">
        <span className="heatmap__legend-label">{Math.round(domain[0])}</span>
        <ol className="heatmap__legend-steps">
          {[...Array(STEPS).keys()].map((s) => {
            const [lo, hi] = step.invertExtent(s);
            return (
              <li key={s} className={`heatmap__legend-step heatmap__cell--step-${s}`} title={`${Math.round(lo)}–${Math.round(hi)}`} />
            );
          })}
        </ol>
        <span className="heatmap__legend-label">{Math.round(domain[1])}</span>
        <span className="heatmap__legend-caption">Average base stat</span>
      </div>
    </div>
  );
}
