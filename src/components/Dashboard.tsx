'use client';

import { maxIndex, mean } from 'd3';
import { useMemo, useState } from 'react';
import type { Generation } from '@/lib/generations';
import {
  averageStatsByType,
  binStatTotals,
  capitalize,
  countByPrimaryType,
  formatName,
  formatPercent,
  formatSigned,
  meanStats,
} from '@/lib/transforms';
import { STAT_KEYS, STAT_LABELS, type Pokemon } from '@/lib/types';
import { Panel } from './ui/Panel';
import { StatTile } from './ui/StatTile';
import { DexList } from './DexList';
import { TypeFilter } from './TypeFilter';
import { StatScanner } from './charts/StatScanner';
import { StatCompareChart } from './charts/StatCompareChart';
import { AttackDefenseScatter } from './charts/AttackDefenseScatter';
import { TypeShareBars } from './charts/TypeShareBars';
import { StatTotalHistogram } from './charts/StatTotalHistogram';
import { TypeStatHeatmap } from './charts/TypeStatHeatmap';

const PIKACHU_ID = 25;

interface DashboardProps {
  generation: Generation;
  pokemon: Pokemon[];
}

/** Owns the two pieces of shared state - highlighted type and scanned entry. */
export function Dashboard({ generation, pokemon }: DashboardProps) {
  const [highlight, setHighlight] = useState<string | null>(null);
  // Pikachu in Gen I; otherwise start with the generation's first entry (its grass starter).
  const [selectedId, setSelectedId] = useState(() =>
    pokemon.some((p) => p.id === PIKACHU_ID) ? PIKACHU_ID : pokemon[0].id,
  );

  // Derive every readout's data once per dataset, not on every render.
  const typeCounts = useMemo(() => countByPrimaryType(pokemon), [pokemon]);
  const typeStats = useMemo(() => averageStatsByType(pokemon), [pokemon]);
  const average = useMemo(() => meanStats(pokemon), [pokemon]);
  const bins = useMemo(() => binStatTotals(pokemon), [pokemon]);
  const averageTotal = Math.round(mean(pokemon, (p) => p.total) ?? 0);
  const strongest = pokemon[maxIndex(pokemon, (p) => p.total)];

  const selectedIndex = Math.max(0, pokemon.findIndex((p) => p.id === selectedId));
  const selected = pokemon[selectedIndex];
  const step = (by: number) => setSelectedId(pokemon[(selectedIndex + by + pokemon.length) % pokemon.length].id);

  const toggleHighlight = (type: string) => setHighlight((current) => (current === type ? null : type));
  const highlightCount = typeCounts.find((t) => t.type === highlight)?.count ?? 0;
  const regionLabel = `Region ${generation.numeral}`;
  const top = typeCounts[0];

  return (
    <div className="dashboard">
      <TypeFilter types={typeCounts.map((t) => t.type)} highlight={highlight} onChange={setHighlight} />

      <section className="dashboard__tiles" aria-label="Summary">
        <StatTile label="Entries" value={pokemon.length} detail={`Generation ${generation.numeral}, ${generation.region}`} />
        <StatTile label="Primary types" value={typeCounts.length} detail={`Most common: ${capitalize(top.type)}`} />
        <StatTile label="Avg stat total" value={averageTotal} detail="Sum of all six base stats" />
        <StatTile label="Strongest" value={strongest.total} detail={formatName(strongest.name)} accent />
      </section>

      <div className="dashboard__body">
        <DexList
          pokemon={pokemon}
          highlight={highlight}
          highlightCount={highlightCount}
          selectedId={selected.id}
          onSelect={setSelectedId}
        />

        <div className="dashboard__panels">
          <Panel
            number="04"
            title={`${formatName(selected.name)} vs the average`}
            intro={
              <StatScanner
                pokemon={selected}
                averageTotal={averageTotal}
                regionLabel={regionLabel}
                onPrev={() => step(-1)}
                onNext={() => step(1)}
              />
            }
            chart={<StatCompareChart pokemon={selected} average={average} averageLabel={`${regionLabel} average`} />}
            table={{
              columns: [
                { key: 'stat', label: 'Stat' },
                { key: 'value', label: formatName(selected.name), numeric: true },
                { key: 'average', label: 'Average', numeric: true },
                { key: 'diff', label: 'Diff', numeric: true },
              ],
              rows: STAT_KEYS.map((key) => {
                const avg = Math.round(average[key]);
                return {
                  stat: STAT_LABELS[key],
                  value: selected.stats[key],
                  average: avg,
                  diff: formatSigned(selected.stats[key] - avg),
                };
              }),
            }}
          />

          <Panel
            number="02"
            title="Attack vs Defense"
            description="Each dot is one entry. Tap a dot to load it into the scanner."
            chart={
              <AttackDefenseScatter
                pokemon={pokemon}
                highlight={highlight}
                selected={selected}
                onSelect={setSelectedId}
              />
            }
          />

          <Panel
            number="01"
            title="Share by primary type"
            description={`${capitalize(top.type)} makes up ${formatPercent(top.count / pokemon.length)} of ${generation.region}. Tap a row to highlight that type.`}
            chart={
              <TypeShareBars data={typeCounts} total={pokemon.length} highlight={highlight} onToggle={toggleHighlight} />
            }
            table={{
              columns: [
                { key: 'type', label: 'Type' },
                { key: 'count', label: 'Count', numeric: true },
                { key: 'share', label: 'Share', numeric: true },
              ],
              rows: typeCounts.map((t) => ({
                type: capitalize(t.type),
                count: t.count,
                share: formatPercent(t.count / pokemon.length),
              })),
              footer: { type: 'Total', count: pokemon.length, share: '100%' },
            }}
          />

          <Panel
            number="03"
            title="Base stat totals"
            description={`Unevolved forms cluster low, fully evolved ones sit higher. The ringed bar holds ${formatName(selected.name)}.`}
            chart={<StatTotalHistogram bins={bins} highlight={highlight} selected={selected} />}
            table={{
              columns: [
                { key: 'range', label: 'Total range' },
                { key: 'count', label: 'Entries', numeric: true },
                { key: 'lit', label: highlight ? capitalize(highlight) : 'Highlighted', numeric: true },
              ],
              rows: bins
                .filter((b) => b.members.length > 0)
                .map((b) => ({
                  range: `${b.lo}–${b.hi}`,
                  count: b.members.length,
                  lit: highlight ? b.members.filter((p) => p.primaryType === highlight).length : '–',
                })),
            }}
          />

          <Panel
            number="05"
            wide
            title="Average stats by primary type"
            description="Darker means higher. Tap a type to highlight it everywhere."
            chart={<TypeStatHeatmap rows={typeStats} highlight={highlight} onToggle={toggleHighlight} />}
          />
        </div>
      </div>
    </div>
  );
}
