// Pure data shaping: raw records in, chart-ready rows out.
// Keeping this separate from the chart components makes each step easy to test
// and is the habit worth building - charts should only draw, never compute.

import { mean, rollups } from 'd3';
import { STAT_KEYS, type Pokemon, type StatKey } from './types';

export interface TypeCount {
  type: string;
  count: number;
}

/** How many Pokémon have each primary type, largest first. */
export function countByPrimaryType(pokemon: Pokemon[]): TypeCount[] {
  return rollups(pokemon, (group) => group.length, (p) => p.primaryType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type));
}

export interface TypeShare extends TypeCount {
  /** Fraction of the whole, 0..1. */
  share: number;
}

/** Each type's count as a share of all Pokémon, largest first. */
export function typeShares(counts: TypeCount[]): TypeShare[] {
  const total = counts.reduce((sum, c) => sum + c.count, 0);
  return counts.map((c) => ({ ...c, share: c.count / total }));
}

export function formatPercent(share: number): string {
  return `${(share * 100).toFixed(share < 0.1 ? 1 : 0)}%`;
}

export interface TypeStatRow {
  type: string;
  count: number;
  values: Record<StatKey, number>;
}

/** Average of each base stat per primary type, in the same order as the counts. */
export function averageStatsByType(pokemon: Pokemon[]): TypeStatRow[] {
  return countByPrimaryType(pokemon).map(({ type, count }) => {
    const group = pokemon.filter((p) => p.primaryType === type);
    return { type, count, values: averageStats(group) };
  });
}

/** Mean of each base stat across a set of Pokémon, rounded to whole numbers. */
export function averageStats(pokemon: Pokemon[]): Record<StatKey, number> {
  return Object.fromEntries(
    STAT_KEYS.map((key) => [key, Math.round(mean(pokemon, (p) => p.stats[key]) ?? 0)]),
  ) as Record<StatKey, number>;
}

const NAME_OVERRIDES: Record<string, string> = {
  'nidoran-f': 'Nidoran ♀',
  'nidoran-m': 'Nidoran ♂',
  'mr-mime': 'Mr. Mime',
  farfetchd: "Farfetch'd",
};

export function formatName(name: string): string {
  return NAME_OVERRIDES[name] ?? name.split('-').map(capitalize).join(' ');
}

/** CSS color for a Pokémon type - the token defined in Sass, per theme. */
export function typeColor(type: string): string {
  return `var(--type-${type})`;
}

export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
