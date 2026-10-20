// Shared, serialisable shapes. The server slims the PokeAPI payload down to
// these before anything reaches the browser.

export const STAT_KEYS = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export const STAT_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
};

/** For narrow columns, where the full label would collide. */
export const STAT_SHORT_LABELS: Record<StatKey, string> = {
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  'special-attack': 'SpA',
  'special-defense': 'SpD',
  speed: 'Spe',
};

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  primaryType: string;
  stats: Record<StatKey, number>;
  /** Base stat total (sum of the six stats). */
  total: number;
  /** Animated GIF when one exists, otherwise a still sprite. */
  sprite: string | null;
  /** The cry, as a small .ogg file. Downloaded only when someone presses play. */
  cry: string | null;
  /** In decimetres, as the API sends it (7 = 0.7 m). */
  height: number;
  /** In hectograms, as the API sends it (69 = 6.9 kg). */
  weight: number;
}

// --- Abilities and moves -------------------------------------------------
// Too heavy to ship for a whole region, so the Field Dex loads these per
// entry from /api/dex/[id] when the INFO or SKILLS tab opens.

export interface Ability {
  name: string;
  hidden: boolean;
  /** One-line English effect text. */
  effect: string;
  /** Species in the National Dex with this ability, this one included. */
  holders: number;
}

export type MoveCategory = 'physical' | 'special' | 'status';

export interface Move {
  name: string;
  /** Level learned; 0 means "on evolution". */
  level: number;
  type: string;
  category: MoveCategory;
  power: number | null;
  accuracy: number | null;
}

export interface PokemonDetails {
  id: number;
  abilities: Ability[];
  /** The rarest ability (fewest holders) - this Pokémon's calling card. */
  signature: string;
  /** Level-up learnset from `versionGroup`, by level then name. */
  moves: Move[];
  /** e.g. "scarlet-violet": the newest game with a level-up learnset. */
  versionGroup: string;
}
