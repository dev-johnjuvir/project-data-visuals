// Actual-stat calculator for the Field Dex STATS tab. Pure functions, no
// data fetching: natures are a fixed list, IVs and EVs are typed in.
//
// The main-series formulas (Gen III onward):
//   HP    = floor((2B + IV + floor(EV/4)) * L / 100) + L + 10
//   other = floor((floor((2B + IV + floor(EV/4)) * L / 100) + 5) * nature)
// where nature is 1.1 for the raised stat, 0.9 for the lowered one, else 1.

import { STAT_KEYS, type Pokemon, type StatKey } from './types';

export const MAX_IV = 31;
export const MAX_EV = 252;
export const MAX_EV_TOTAL = 510;

export interface Nature {
  name: string;
  up: StatKey | null;
  down: StatKey | null;
}

const n = (name: string, up: StatKey | null = null, down: StatKey | null = null): Nature => ({ name, up, down });

/** All 25, neutral ones first, then grouped by the stat they raise. */
export const NATURES: Nature[] = [
  n('Hardy'), n('Docile'), n('Serious'), n('Bashful'), n('Quirky'),
  n('Lonely', 'attack', 'defense'), n('Brave', 'attack', 'speed'),
  n('Adamant', 'attack', 'special-attack'), n('Naughty', 'attack', 'special-defense'),
  n('Bold', 'defense', 'attack'), n('Relaxed', 'defense', 'speed'),
  n('Impish', 'defense', 'special-attack'), n('Lax', 'defense', 'special-defense'),
  n('Modest', 'special-attack', 'attack'), n('Mild', 'special-attack', 'defense'),
  n('Quiet', 'special-attack', 'speed'), n('Rash', 'special-attack', 'special-defense'),
  n('Calm', 'special-defense', 'attack'), n('Gentle', 'special-defense', 'defense'),
  n('Sassy', 'special-defense', 'speed'), n('Careful', 'special-defense', 'special-attack'),
  n('Timid', 'speed', 'attack'), n('Hasty', 'speed', 'defense'),
  n('Jolly', 'speed', 'special-attack'), n('Naive', 'speed', 'special-defense'),
];

export interface Build {
  level: number;
  nature: string;
  ivs: Record<StatKey, number>;
  evs: Record<StatKey, number>;
}

const allStats = (value: number) => Object.fromEntries(STAT_KEYS.map((k) => [k, value])) as Record<StatKey, number>;

/** Level 50 (the competitive standard), neutral nature, perfect IVs, no EVs. */
export const DEFAULT_BUILD: Build = { level: 50, nature: 'Hardy', ivs: allStats(MAX_IV), evs: allStats(0) };

export const natureOf = (name: string) => NATURES.find((x) => x.name === name) ?? NATURES[0];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(value) || 0));

export const clampLevel = (level: number) => clamp(level, 1, 100);
export const clampIv = (iv: number) => clamp(iv, 0, MAX_IV);

/** Set one EV, capped at 252 and at whatever the 510 total leaves free. */
export function setEv(evs: Record<StatKey, number>, key: StatKey, value: number): Record<StatKey, number> {
  const others = STAT_KEYS.reduce((sum, k) => (k === key ? sum : sum + evs[k]), 0);
  return { ...evs, [key]: clamp(value, 0, Math.min(MAX_EV, MAX_EV_TOTAL - others)) };
}

export const evTotal = (evs: Record<StatKey, number>) => STAT_KEYS.reduce((sum, k) => sum + evs[k], 0);

/** The six actual stats for this Pokémon with this build. */
export function calcStats(pokemon: Pokemon, build: Build): Record<StatKey, number> {
  const nature = natureOf(build.nature);
  const { level } = build;
  return Object.fromEntries(
    STAT_KEYS.map((key) => {
      const core = Math.floor(((2 * pokemon.stats[key] + build.ivs[key] + Math.floor(build.evs[key] / 4)) * level) / 100);
      if (key === 'hp') {
        // Shedinja's HP is always 1, whatever the build.
        return [key, pokemon.name === 'shedinja' ? 1 : core + level + 10];
      }
      const multiplier = nature.up === key ? 1.1 : nature.down === key ? 0.9 : 1;
      return [key, Math.floor((core + 5) * multiplier)];
    }),
  ) as Record<StatKey, number>;
}
