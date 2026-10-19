'use client';

import { maxIndex, mean } from 'd3';
import { useMemo, useState } from 'react';
import type { Generation } from '@/lib/generations';
import {
  averageStats,
  averageStatsByType,
  capitalize,
  countByPrimaryType,
  formatName,
  formatPercent,
  typeColor,
} from '@/lib/transforms';
import { STAT_KEYS, STAT_LABELS, type Pokemon } from '@/lib/types';
import { ChartCard } from './ui/ChartCard';
import { Legend } from './ui/Legend';
import { StatTile } from './ui/StatTile';
import { FilterBar } from './FilterBar';
import { PokemonProfile } from './PokemonProfile';
import { TypeShareDonut } from './charts/TypeShareDonut';
import { AttackDefenseScatter } from './charts/AttackDefenseScatter';
import { StatTotalHistogram } from './charts/StatTotalHistogram';
import { TypeStatHeatmap } from './charts/TypeStatHeatmap';
import { StatCompareChart } from './charts/StatCompareChart';

const PIKACHU_ID = 25;

const statColumns = STAT_KEYS.map((key) => ({ key, label: STAT_LABELS[key], numeric: true }));

interface DashboardProps {
  generation: Generation;
  pokemon: Pokemon[];
}

export function Dashboard({ generation, pokemon }: DashboardProps) {
  const [highlight, setHighlight] = useState<string | null>(null);
  // Pikachu in Gen I; otherwise start with the generation's first Pokémon (its grass starter).
  const [selectedId, setSelectedId] = useState(() =>
    pokemon.some((p) => p.id === PIKACHU_ID) ? PIKACHU_ID : pokemon[0].id,
  );
  const genLabel = `Gen ${generation.numeral}`;

  // Derive every chart's data once per dataset, not on every render.
  const typeCounts = useMemo(() => countByPrimaryType(pokemon), [pokemon]);
  const typeStats = useMemo(() => averageStatsByType(pokemon), [pokemon]);
  const average = useMemo(() => averageStats(pokemon), [pokemon]);
  const averageTotal = Math.round(mean(pokemon, (p) => p.total) ?? 0);
  const strongest = pokemon[maxIndex(pokemon, (p) => p.total)];
  const selected = pokemon.find((p) => p.id === selectedId) ?? pokemon[0];
  const types = typeCounts.map((t) => t.type);

  const highlightLegend = highlight ? (
    <Legend
      items={[
        { label: capitalize(highlight), color: typeColor(highlight) },
        { label: 'Other types', color: 'var(--mark-muted)' },
      ]}
    />
  ) : null;

  return (
    <div className="dashboard">
      <FilterBar
        generation={generation}
        types={types}
        pokemon={pokemon}
        highlight={highlight}
        selectedId={selectedId}
        onHighlightChange={setHighlight}
        onSelectedChange={setSelectedId}
      />

      <div className="dashboard__tiles">
        <StatTile label="Pokémon" value={pokemon.length} detail={`Generation ${generation.numeral}, ${generation.region}`} />
        <StatTile label="Primary types" value={types.length} detail={`Most common: ${capitalize(types[0])}`} />
        <StatTile label="Average stat total" value={averageTotal} detail="Sum of all six base stats" />
        <StatTile label="Strongest" value={strongest.total} detail={formatName(strongest.name)} />
      </div>

      <div className="dashboard__grid">
        <ChartCard
          title="Share of Pokémon by primary type"
          description={`${capitalize(types[0])} makes up ${formatPercent(typeCounts[0].count / pokemon.length)} of ${generation.region}. Hover a slice or a legend row for details.`}
          table={{
            columns: [
              { key: 'type', label: 'Type' },
              { key: 'count', label: 'Pokémon', numeric: true },
              { key: 'share', label: 'Share', numeric: true },
            ],
            rows: typeCounts.map((t) => ({
              type: capitalize(t.type),
              count: t.count,
              share: formatPercent(t.count / pokemon.length),
            })),
          }}
        >
          <TypeShareDonut data={typeCounts} total={pokemon.length} highlight={highlight} />
        </ChartCard>

        <ChartCard
          title="Attack vs Defense"
          description="Each dot is one Pokémon. Click any dot to inspect it below."
          legend={highlightLegend}
          table={{
            columns: [
              { key: 'id', label: '#', numeric: true },
              { key: 'name', label: 'Pokémon' },
              { key: 'type', label: 'Primary type' },
              { key: 'attack', label: 'Attack', numeric: true },
              { key: 'defense', label: 'Defense', numeric: true },
            ],
            rows: pokemon.map((p) => ({
              id: p.id,
              name: formatName(p.name),
              type: capitalize(p.primaryType),
              attack: p.stats.attack,
              defense: p.stats.defense,
            })),
          }}
        >
          <AttackDefenseScatter pokemon={pokemon} highlight={highlight} selectedId={selectedId} onSelect={setSelectedId} />
        </ChartCard>

        <ChartCard
          title="Distribution of base stat totals"
          description="Unevolved Pokémon cluster at the low end, fully evolved ones higher up. Same 175–725 scale for every generation."
          legend={
            highlight ? (
              <Legend
                items={[
                  { label: capitalize(highlight), color: typeColor(highlight) },
                  { label: 'All Pokémon', color: 'var(--mark-muted)' },
                ]}
              />
            ) : null
          }
          table={{
            columns: [
              { key: 'name', label: 'Pokémon' },
              { key: 'type', label: 'Primary type' },
              { key: 'total', label: 'Stat total', numeric: true },
            ],
            rows: [...pokemon]
              .sort((a, b) => b.total - a.total)
              .map((p) => ({ name: formatName(p.name), type: capitalize(p.primaryType), total: p.total })),
          }}
        >
          <StatTotalHistogram pokemon={pokemon} highlight={highlight} />
        </ChartCard>

        <ChartCard
          title={`${formatName(selected.name)} vs the average`}
          description={`Six base stats against the Generation ${generation.numeral} mean, on a fixed 0–255 scale.`}
          legend={
            <>
              <PokemonProfile pokemon={selected} averageTotal={averageTotal} />
              <Legend
                items={[
                  { label: formatName(selected.name), color: 'var(--series-1)' },
                  { label: `${genLabel} average`, color: 'var(--series-2)' },
                ]}
              />
            </>
          }
          table={{
            columns: [
              { key: 'stat', label: 'Stat' },
              { key: 'value', label: formatName(selected.name), numeric: true },
              { key: 'average', label: `${genLabel} average`, numeric: true },
            ],
            rows: STAT_KEYS.map((key) => ({ stat: STAT_LABELS[key], value: selected.stats[key], average: average[key] })),
          }}
        >
          <StatCompareChart pokemon={selected} average={average} averageLabel={`${genLabel} average`} />
        </ChartCard>

        <ChartCard
          modifier="wide"
          title="Average stats by primary type"
          description="Darker means higher. Read across a row for a type's profile, down a column to compare one stat."
          table={{
            columns: [{ key: 'type', label: 'Type' }, { key: 'count', label: 'Pokémon', numeric: true }, ...statColumns],
            rows: typeStats.map((r) => ({ type: capitalize(r.type), count: r.count, ...r.values })),
          }}
        >
          <TypeStatHeatmap rows={typeStats} highlight={highlight} />
        </ChartCard>
      </div>
    </div>
  );
}
