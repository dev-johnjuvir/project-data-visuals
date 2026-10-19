'use client';

import { scaleLinear } from 'd3';
import { useState } from 'react';
import { useElementWidth } from '@/hooks/useElementWidth';
import { horizontalBarPath } from '@/lib/geometry';
import { formatName } from '@/lib/transforms';
import { STAT_KEYS, STAT_LABELS, type Pokemon, type StatKey } from '@/lib/types';
import { ChartSvg } from '@/components/ui/ChartSvg';
import { Tooltip, TooltipRow } from '@/components/ui/Tooltip';

// Lesson: grouped bars compare two series on the SAME scale. A radar chart is
// the popular choice for stats, but angles and areas are hard to read
// accurately - aligned bars on a shared baseline are far easier to compare.

const MARGIN = { top: 4, right: 40, bottom: 28, left: 64 };
const ROW_HEIGHT = 40;
const BAR_HEIGHT = 12;
const BAR_GAP = 2;
/** The highest base stat in the main series games is 255. */
const MAX_STAT = 255;

interface StatCompareChartProps {
  pokemon: Pokemon;
  average: Record<StatKey, number>;
  averageLabel: string;
}

export function StatCompareChart({ pokemon, average, averageLabel }: StatCompareChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<StatKey | null>(null);

  const height = MARGIN.top + STAT_KEYS.length * ROW_HEIGHT + MARGIN.bottom;
  const plotBottom = MARGIN.top + STAT_KEYS.length * ROW_HEIGHT;
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  // A fixed domain keeps bar lengths comparable when you switch Pokémon.
  const x = scaleLinear().domain([0, MAX_STAT]).range([0, innerWidth]);
  const groupTop = (ROW_HEIGHT - (BAR_HEIGHT * 2 + BAR_GAP)) / 2;

  return (
    <div ref={ref} className="chart">
      <ChartSvg width={width} height={height} label={`${formatName(pokemon.name)} base stats compared with the ${averageLabel}`}>
          {[0, 50, 100, 150, 200, 250].map((tick) => (
            <g key={tick} transform={`translate(${MARGIN.left + x(tick)},0)`}>
              <line className="chart__grid" y1={MARGIN.top} y2={plotBottom} />
              <text className="chart__tick" y={plotBottom + 18} textAnchor="middle">
                {tick}
              </text>
            </g>
          ))}

          {STAT_KEYS.map((key, i) => {
            const y = MARGIN.top + i * ROW_HEIGHT + groupTop;
            const value = pokemon.stats[key];
            return (
              <g key={key}>
                <rect
                  className={`chart__hit${hovered === key ? ' chart__hit--active' : ''}`}
                  x={0}
                  y={MARGIN.top + i * ROW_HEIGHT}
                  width={width}
                  height={ROW_HEIGHT}
                  onMouseEnter={() => setHovered(key)}
                  onMouseLeave={() => setHovered(null)}
                />
                <text className="chart__category" x={MARGIN.left - 8} y={MARGIN.top + i * ROW_HEIGHT + ROW_HEIGHT / 2} dy="0.35em" textAnchor="end">
                  {STAT_LABELS[key]}
                </text>
                <path className="chart__bar" d={horizontalBarPath(MARGIN.left, y, x(value), BAR_HEIGHT)} />
                <path
                  className="chart__bar chart__bar--secondary"
                  d={horizontalBarPath(MARGIN.left, y + BAR_HEIGHT + BAR_GAP, x(average[key]), BAR_HEIGHT)}
                />
                {/* Direct-label the series that matters; the average stays in tooltip + table */}
                <text className="chart__value" x={MARGIN.left + x(value) + 6} y={y + BAR_HEIGHT / 2} dy="0.35em">
                  {value}
                </text>
              </g>
            );
          })}

          <line className="chart__baseline" x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={plotBottom} />
      </ChartSvg>

      {hovered && (
        <Tooltip
          x={MARGIN.left + x(Math.max(pokemon.stats[hovered], average[hovered]))}
          y={MARGIN.top + STAT_KEYS.indexOf(hovered) * ROW_HEIGHT + ROW_HEIGHT / 2}
          containerWidth={width}
        >
          <p className="tooltip__title">{STAT_LABELS[hovered]}</p>
          <TooltipRow label={formatName(pokemon.name)} value={pokemon.stats[hovered]} color="var(--series-1)" />
          <TooltipRow label={averageLabel} value={average[hovered]} color="var(--series-2)" />
          <TooltipRow label="Difference" value={formatDelta(pokemon.stats[hovered] - average[hovered])} />
        </Tooltip>
      )}
    </div>
  );
}

function formatDelta(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0';
}
