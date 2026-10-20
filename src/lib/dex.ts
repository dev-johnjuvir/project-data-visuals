// Data shaping for the Field Dex page: search, rankings and the per-entry
// facts on the INFO tab. Pure functions, like transforms.ts.

import { formatName } from './transforms';
import { STAT_KEYS, STAT_LABELS, type Pokemon, type StatKey } from './types';

/** Every type that appears in either slot, alphabetical. */
export function typesInUse(pokemon: Pokemon[]): string[] {
  return [...new Set(pokemon.flatMap((p) => p.types))].sort();
}

/**
 * Search by name ("char") or Pokédex number ("4", "#004" - matched as a
 * prefix, so "1" finds #1, #10-19, #100-151), optionally limited to a type
 * in either slot.
 */
export function filterEntries(pokemon: Pokemon[], query: string, type: string | null): Pokemon[] {
  const q = query.trim().toLowerCase().replace(/^#/, '');
  const asNumber = /^\d+$/.test(q) ? String(parseInt(q, 10)) : null;
  return pokemon.filter((p) => {
    if (type && !p.types.includes(type)) return false;
    if (!q) return true;
    // By dex number, so "6" finds Charizard and both its megas.
    if (asNumber !== null) return String(p.species).startsWith(asNumber);
    // Match the name as displayed ("mr. mime") and as the API spells it ("mr-mime").
    return formatName(p.name).toLowerCase().includes(q) || p.name.includes(q);
  });
}

export interface DexRanking {
  /** 1 = highest base total in the region. Ties share a rank. */
  rank: number;
  /** Rank among Pokémon with the same primary type. */
  typeRank: number;
  typeCount: number;
  /** Share of the others this one strictly beats, 0..1. */
  beats: number;
  /** Up to four neighbours by base total, closest first in list order. */
  nearest: Pokemon[];
}

export function rankEntry(pokemon: Pokemon[], selected: Pokemon): DexRanking {
  const sameType = pokemon.filter((p) => p.primaryType === selected.primaryType);
  const above = (group: Pokemon[]) => group.filter((p) => p.total > selected.total).length;
  const below = pokemon.filter((p) => p.total < selected.total).length;

  // A window of five around the entry in the ranked list, minus the entry.
  const ranked = [...pokemon].sort((a, b) => b.total - a.total || a.id - b.id);
  const at = ranked.findIndex((p) => p.id === selected.id);
  const start = Math.max(0, Math.min(at - 2, ranked.length - 5));
  const nearest = ranked.slice(start, start + 5).filter((p) => p.id !== selected.id);

  return {
    rank: above(pokemon) + 1,
    typeRank: above(sameType) + 1,
    typeCount: sameType.length,
    beats: pokemon.length > 1 ? below / (pokemon.length - 1) : 0,
    nearest,
  };
}

export interface StatExtreme {
  key: StatKey;
  label: string;
  value: number;
}

/** Highest and lowest base stat (first one wins a tie). */
export function statExtremes(p: Pokemon): { best: StatExtreme; worst: StatExtreme } {
  const pick = (better: (a: number, b: number) => boolean) =>
    STAT_KEYS.reduce((acc, key) => (better(p.stats[key], p.stats[acc]) ? key : acc), STAT_KEYS[0]);
  const describe = (key: StatKey): StatExtreme => ({ key, label: STAT_LABELS[key], value: p.stats[key] });
  return { best: describe(pick((a, b) => a > b)), worst: describe(pick((a, b) => a < b)) };
}

export type Side = 'left' | 'right' | 'tie';

export interface StatMatchup {
  key: StatKey;
  left: number;
  right: number;
  winner: Side;
}

export interface Matchup {
  rows: StatMatchup[];
  total: { left: number; right: number; winner: Side };
  /** How many of the six stats each side wins outright. */
  wins: { left: number; right: number };
}

const winner = (left: number, right: number): Side => (left > right ? 'left' : right > left ? 'right' : 'tie');

/** Head-to-head of two entries, stat by stat - the VS tab's data. */
export function compareStats(left: Pokemon, right: Pokemon): Matchup {
  const rows = STAT_KEYS.map((key) => ({
    key,
    left: left.stats[key],
    right: right.stats[key],
    winner: winner(left.stats[key], right.stats[key]),
  }));
  return {
    rows,
    total: { left: left.total, right: right.total, winner: winner(left.total, right.total) },
    wins: {
      left: rows.filter((r) => r.winner === 'left').length,
      right: rows.filter((r) => r.winner === 'right').length,
    },
  };
}

export const formatHeight =(dm: number) => `${(dm / 10).toFixed(1)} m`;
export const formatWeight = (hg: number) => `${(hg / 10).toFixed(1)} kg`;
