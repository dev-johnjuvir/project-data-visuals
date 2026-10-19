'use client';

import { Delaunay, max, maxIndex, scaleLinear } from 'd3';
import { useMemo, useState, type MouseEvent } from 'react';
import { useElementWidth } from '@/hooks/useElementWidth';
import { capitalize, formatName } from '@/lib/transforms';
import type { Pokemon } from '@/lib/types';
import { ChartSvg } from '@/components/ui/ChartSvg';
import { Tooltip, TooltipRow } from '@/components/ui/Tooltip';

// Lesson: a scatter plot shows the relationship between two measures.
// With 151 overlapping dots, hovering an exact 8px dot is frustrating, so we
// use a Delaunay "nearest point" lookup - the pointer snaps to the closest dot.

const MARGIN = { top: 16, right: 24, bottom: 48, left: 52 };
const HEIGHT = 380;
const DOT_RADIUS = 4;
const SNAP_DISTANCE = 32;

interface AttackDefenseScatterProps {
  pokemon: Pokemon[];
  highlight: string | null;
  selectedId: number;
  onSelect: (id: number) => void;
}

export function AttackDefenseScatter({ pokemon, highlight, selectedId, onSelect }: AttackDefenseScatterProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hovered, setHovered] = useState<number | null>(null);

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

  const x = useMemo(
    () => scaleLinear().domain([0, max(pokemon, (p) => p.stats.attack) ?? 1]).nice().range([0, innerWidth]),
    [pokemon, innerWidth],
  );
  const y = useMemo(
    () => scaleLinear().domain([0, max(pokemon, (p) => p.stats.defense) ?? 1]).nice().range([innerHeight, 0]),
    [pokemon, innerHeight],
  );

  const delaunay = useMemo(
    () => Delaunay.from(pokemon, (p) => x(p.stats.attack), (p) => y(p.stats.defense)),
    [pokemon, x, y],
  );

  // Draw the muted dots first so highlighted ones always sit on top.
  const ordered = useMemo(() => {
    if (!highlight) return pokemon;
    return [...pokemon].sort(
      (a, b) => Number(a.primaryType === highlight) - Number(b.primaryType === highlight),
    );
  }, [pokemon, highlight]);

  const labelled = new Set([
    pokemon[maxIndex(pokemon, (p) => p.stats.attack)].id,
    pokemon[maxIndex(pokemon, (p) => p.stats.defense)].id,
    selectedId,
  ]);

  function handleMove(event: MouseEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const mx = event.clientX - box.left;
    const my = event.clientY - box.top;
    const index = delaunay.find(mx, my);
    const p = pokemon[index];
    const distance = Math.hypot(x(p.stats.attack) - mx, y(p.stats.defense) - my);
    setHovered(distance <= SNAP_DISTANCE ? index : null);
  }

  const hoveredPokemon = hovered === null ? null : pokemon[hovered];

  return (
    <div ref={ref} className="chart">
      <ChartSvg width={width} height={HEIGHT} label="Scatter plot of attack versus defense">
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {y.ticks(5).map((tick) => (
              <g key={`y${tick}`} transform={`translate(0,${y(tick)})`}>
                <line className="chart__grid" x2={innerWidth} />
                <text className="chart__tick" x={-8} dy="0.35em" textAnchor="end">
                  {tick}
                </text>
              </g>
            ))}
            {x.ticks(6).map((tick) => (
              <text key={`x${tick}`} className="chart__tick" x={x(tick)} y={innerHeight + 18} textAnchor="middle">
                {tick}
              </text>
            ))}
            <line className="chart__baseline" y1={innerHeight} y2={innerHeight} x2={innerWidth} />

            <text className="chart__axis-title" x={innerWidth / 2} y={innerHeight + 40} textAnchor="middle">
              Attack
            </text>
            <text className="chart__axis-title" transform={`translate(-38,${innerHeight / 2}) rotate(-90)`} textAnchor="middle">
              Defense
            </text>

            {ordered.map((p) => {
              const isMuted = highlight !== null && p.primaryType !== highlight;
              const modifiers = [
                // A highlighted type keeps the same color it has in the bar chart.
                highlight !== null && !isMuted && `chart__dot--type-${highlight}`,
                isMuted && 'chart__dot--muted',
                p.id === selectedId && 'chart__dot--selected',
              ].filter(Boolean);
              return (
                <circle
                  key={p.id}
                  className={['chart__dot', ...modifiers].join(' ')}
                  cx={x(p.stats.attack)}
                  cy={y(p.stats.defense)}
                  r={p.id === selectedId ? DOT_RADIUS + 2 : DOT_RADIUS}
                />
              );
            })}

            {/* Selective direct labels: the two extremes and the selected Pokémon */}
            {pokemon
              .filter((p) => labelled.has(p.id))
              .map((p) => (
                <text
                  key={`label-${p.id}`}
                  className="chart__annotation"
                  x={x(p.stats.attack)}
                  y={y(p.stats.defense) - 10}
                  textAnchor={x(p.stats.attack) > innerWidth - 60 ? 'end' : 'middle'}
                >
                  {formatName(p.name)}
                </text>
              ))}

            {hoveredPokemon && (
              <circle className="chart__focus-ring" cx={x(hoveredPokemon.stats.attack)} cy={y(hoveredPokemon.stats.defense)} r={DOT_RADIUS + 4} />
            )}

            {/* Transparent overlay captures the pointer for the nearest-point lookup */}
            <rect
              className="chart__overlay"
              width={innerWidth}
              height={innerHeight}
              onMouseMove={handleMove}
              onMouseLeave={() => setHovered(null)}
              onClick={() => hoveredPokemon && onSelect(hoveredPokemon.id)}
              style={{ cursor: hoveredPokemon ? 'pointer' : 'default' }}
            />
          </g>
      </ChartSvg>

      {hoveredPokemon && (
        <Tooltip
          x={MARGIN.left + x(hoveredPokemon.stats.attack)}
          y={MARGIN.top + y(hoveredPokemon.stats.defense)}
          containerWidth={width}
        >
          <p className="tooltip__title">
            #{hoveredPokemon.id} {formatName(hoveredPokemon.name)}
          </p>
          <TooltipRow label="Type" value={hoveredPokemon.types.map(capitalize).join(' / ')} />
          <TooltipRow label="Attack" value={hoveredPokemon.stats.attack} />
          <TooltipRow label="Defense" value={hoveredPokemon.stats.defense} />
          <p className="tooltip__hint">Click to inspect</p>
        </Tooltip>
      )}
    </div>
  );
}
