'use client';

import { arc, pie, type PieArcDatum } from 'd3';
import { useMemo, useState } from 'react';
import { useElementWidth } from '@/hooks/useElementWidth';
import { capitalize, formatPercent, typeColor, typeShares, type TypeCount, type TypeShare } from '@/lib/transforms';
import { ChartSvg } from '@/components/ui/ChartSvg';
import { Tooltip, TooltipRow } from '@/components/ui/Tooltip';

// Lesson: a donut answers "what share of the whole?". Every type gets its own
// slice. People judge angles less accurately than bar lengths, so the legend
// beside it spells out each type's exact count and percentage - the chart
// gives the gist, the legend gives the numbers. The hole holds the total the
// shares add up to.

const HEIGHT = 260;
const RING = 0.38; // ring thickness as a fraction of the radius
const GROW = 6; // how far the hovered slice pops out

interface TypeShareDonutProps {
  data: TypeCount[];
  total: number;
  highlight: string | null;
}

export function TypeShareDonut({ data, total, highlight }: TypeShareDonutProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<string | null>(null);

  const shares = useMemo(() => typeShares(data), [data]);
  // sort(null) keeps our order (largest first) instead of letting d3 re-sort.
  const arcs = useMemo(() => pie<TypeShare>().value((d) => d.count).sort(null)(shares), [shares]);

  const radius = Math.min(width, HEIGHT) / 2 - GROW - 2;
  const cx = width / 2;
  const cy = HEIGHT / 2;
  const slice = arc<PieArcDatum<TypeShare>>().innerRadius(radius * (1 - RING)).cornerRadius(2);

  const isMuted = (type: string) => highlight !== null && type !== highlight;
  const hoveredArc = arcs.find((a) => a.data.type === hovered) ?? null;

  // Tooltip sits at the outer edge of the hovered slice, at its mid-angle.
  const midAngle = hoveredArc ? (hoveredArc.startAngle + hoveredArc.endAngle) / 2 : 0;

  return (
    <div className="type-donut">
      <div ref={ref} className="chart type-donut__plot">
        <ChartSvg width={width} height={HEIGHT} label="Donut chart of each primary type's share of all Pokémon">
          <g transform={`translate(${cx},${cy})`}>
            {arcs.map((a) => (
              <path
                key={a.data.type}
                className={`type-donut__slice type-donut__slice--type-${a.data.type}${
                  isMuted(a.data.type) ? ' type-donut__slice--muted' : ''
                }`}
                d={slice.outerRadius(a.data.type === hovered ? radius + GROW : radius)(a) ?? ''}
                onMouseEnter={() => setHovered(a.data.type)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
            <text className="type-donut__total" textAnchor="middle" dy="0.1em">
              {total}
            </text>
            <text className="type-donut__total-label" textAnchor="middle" dy="1.8em">
              Pokémon
            </text>
          </g>
        </ChartSvg>

        {hoveredArc && (
          <Tooltip
            x={cx + Math.sin(midAngle) * radius}
            y={cy - Math.cos(midAngle) * radius}
            containerWidth={width}
          >
            <p className="tooltip__title">{capitalize(hoveredArc.data.type)}</p>
            <TooltipRow label="Pokémon" value={hoveredArc.data.count} color={typeColor(hoveredArc.data.type)} />
            <TooltipRow label="Share" value={formatPercent(hoveredArc.data.share)} />
          </Tooltip>
        )}
      </div>

      {/* Every slice, with its exact count and share - nothing hidden */}
      <ul className="type-donut__legend">
        {shares.map((d) => (
          <li
            key={d.type}
            className={`type-donut__item${d.type === hovered ? ' type-donut__item--hovered' : ''}${
              isMuted(d.type) ? ' type-donut__item--muted' : ''
            }`}
            onMouseEnter={() => setHovered(d.type)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="type-donut__swatch" style={{ background: typeColor(d.type) }} aria-hidden="true" />
            <span className="type-donut__name">{capitalize(d.type)}</span>
            <span className="type-donut__count">{d.count}</span>
            <span className="type-donut__share">{formatPercent(d.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
