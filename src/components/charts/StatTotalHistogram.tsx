'use client';

import { bin, max, range, scaleLinear } from 'd3';
import { useMemo, useState } from 'react';
import { useElementWidth } from '@/hooks/useElementWidth';
import { verticalBarPath } from '@/lib/geometry';
import { capitalize, typeColor } from '@/lib/transforms';
import type { Pokemon } from '@/lib/types';
import { ChartSvg } from '@/components/ui/ChartSvg';
import { Tooltip, TooltipRow } from '@/components/ui/Tooltip';

// Lesson: a histogram shows the *shape* of one measure - where values cluster,
// how spread out they are, and whether there are outliers. Bin width is a
// design decision: too wide hides structure, too narrow turns into noise.

const MARGIN = { top: 16, right: 16, bottom: 48, left: 40 };
const HEIGHT = 300;
const BIN_SIZE = 25;
// Fixed across generations so their shapes are comparable. Covers every
// Pokémon from Wishiwashi (175) to Arceus (720).
const DOMAIN: [number, number] = [175, 725];
const GAP = 2;

interface StatTotalHistogramProps {
  pokemon: Pokemon[];
  highlight: string | null;
}

export function StatTotalHistogram({ pokemon, highlight }: StatTotalHistogramProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);

  const bins = useMemo(
    () =>
      bin<Pokemon, number>()
        .value((p) => p.total)
        .domain(DOMAIN)
        .thresholds(range(DOMAIN[0] + BIN_SIZE, DOMAIN[1], BIN_SIZE))(pokemon),
    [pokemon],
  );

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const x = scaleLinear().domain(DOMAIN).range([0, innerWidth]);
  const y = scaleLinear()
    .domain([0, max(bins, (b) => b.length) ?? 1])
    .nice()
    .range([innerHeight, 0]);

  const highlightCount = (b: Pokemon[]) => b.filter((p) => p.primaryType === highlight).length;
  const hoveredBin = hovered === null ? null : bins[hovered];

  return (
    <div ref={ref} className="chart">
      <ChartSvg width={width} height={HEIGHT} label="Histogram of base stat totals">
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {y.ticks(5).map((tick) => (
              <g key={tick} transform={`translate(0,${y(tick)})`}>
                <line className="chart__grid" x2={innerWidth} />
                <text className="chart__tick" x={-8} dy="0.35em" textAnchor="end">
                  {tick}
                </text>
              </g>
            ))}

            {bins.map((b, i) => {
              const x0 = x(b.x0 ?? 0);
              const barWidth = Math.max(0, x(b.x1 ?? 0) - x0 - GAP);
              const subset = highlight ? highlightCount(b) : 0;
              return (
                <g key={i}>
                  <rect
                    className={`chart__hit${i === hovered ? ' chart__hit--active' : ''}`}
                    x={x0}
                    y={0}
                    width={barWidth + GAP}
                    height={innerHeight}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  <path
                    className={`chart__bar${highlight ? ' chart__bar--muted' : ''}`}
                    d={verticalBarPath(x0 + GAP / 2, y(b.length), barWidth, innerHeight - y(b.length))}
                  />
                  {/* The highlighted type is a part of the whole, drawn from the same baseline */}
                  {highlight && subset > 0 && (
                    <path className={`chart__bar chart__bar--type-${highlight}`} d={verticalBarPath(x0 + GAP / 2, y(subset), barWidth, innerHeight - y(subset))} />
                  )}
                </g>
              );
            })}

            {range(200, DOMAIN[1] + 1, 100).map((tick) => (
              <text key={tick} className="chart__tick" x={x(tick)} y={innerHeight + 18} textAnchor="middle">
                {tick}
              </text>
            ))}
            <line className="chart__baseline" y1={innerHeight} y2={innerHeight} x2={innerWidth} />
            <text className="chart__axis-title" x={innerWidth / 2} y={innerHeight + 40} textAnchor="middle">
              Base stat total
            </text>
          </g>
      </ChartSvg>

      {hoveredBin && hovered !== null && (
        <Tooltip
          x={MARGIN.left + x(((hoveredBin.x0 ?? 0) + (hoveredBin.x1 ?? 0)) / 2)}
          y={MARGIN.top + y(hoveredBin.length)}
          containerWidth={width}
        >
          <p className="tooltip__title">
            Total {hoveredBin.x0}–{(hoveredBin.x1 ?? 0) - 1}
          </p>
          <TooltipRow label="All Pokémon" value={hoveredBin.length} color={highlight ? 'var(--mark-muted)' : 'var(--series-1)'} />
          {highlight && <TooltipRow label={capitalize(highlight)} value={highlightCount(hoveredBin)} color={typeColor(highlight)} />}
        </Tooltip>
      )}
    </div>
  );
}
