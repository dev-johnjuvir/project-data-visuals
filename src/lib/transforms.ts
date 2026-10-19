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

export interface TypeStatRow {
  type: string;
  count: number;
  values: Record<StatKey, number>;
}

/** Average of each base stat per primary type, in the same order as the counts. */
export function averageStatsByType(pokemon: Pokemon[]): TypeStatRow[] {
  return countByPrimaryType(pokemon).map(({ type, count }) => {
    const group = pokemon.filter((p) => p.primaryType === type);
    return { type, count, values: roundStats(meanStats(group)) };
  });
}

/** Exact mean of each base stat - unrounded, so markers land precisely. */
export function meanStats(pokemon: Pokemon[]): Record<StatKey, number> {
  return Object.fromEntries(STAT_KEYS.map((key) => [key, mean(pokemon, (p) => p.stats[key]) ?? 0])) as Record<
    StatKey,
    number
  >;
}

export function roundStats(stats: Record<StatKey, number>): Record<StatKey, number> {
  return Object.fromEntries(STAT_KEYS.map((key) => [key, Math.round(stats[key])])) as Record<StatKey, number>;
}

// Base stat totals are binned on one fixed scale for every generation, so
// the shapes are comparable. It covers Wishiwashi (175) to Arceus (720).
export const TOTAL_MIN = 175;
export const TOTAL_MAX = 725;
export const TOTAL_BIN = 25;

export interface TotalBin {
  lo: number;
  /** Inclusive upper bound, e.g. 175-199. */
  hi: number;
  members: Pokemon[];
}

export function totalBinIndex(total: number): number {
  const last = (TOTAL_MAX - TOTAL_MIN) / TOTAL_BIN - 1;
  return Math.min(last, Math.max(0, Math.floor((total - TOTAL_MIN) / TOTAL_BIN)));
}

export function binStatTotals(pokemon: Pokemon[]): TotalBin[] {
  const bins: TotalBin[] = [];
  for (let lo = TOTAL_MIN; lo < TOTAL_MAX; lo += TOTAL_BIN) bins.push({ lo, hi: lo + TOTAL_BIN - 1, members: [] });
  for (const p of pokemon) bins[totalBinIndex(p.total)].members.push(p);
  return bins;
}

export function formatPercent(share: number): string {
  return `${(share * 100).toFixed(share < 0.1 ? 1 : 0)}%`;
}

/** "+12", "−8" (a true minus sign) or "±0". */
export function formatSigned(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '±0';
}

/** Pokédex number, e.g. 25 -> "#025". */
export function formatDexNumber(id: number): string {
  return `#${String(id).padStart(3, '0')}`;
}

const NAME_OVERRIDES: Record<string, string> = {
  'nidoran-f': 'Nidoran ♀',
  'nidoran-m': 'Nidoran ♂',
  'mr-mime': 'Mr. Mime',
  farfetchd: 'Farfetch’d',
};

export function formatName(name: string): string {
  return NAME_OVERRIDES[name] ?? name.split('-').map(capitalize).join(' ');
}

export function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
