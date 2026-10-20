// Server-only: build one entry's abilities and level-up moves from PokeAPI.
// Abilities and moves are shared across many Pokémon, so their lookups are
// memoised per name - browsing a whole region refetches very little.

import { fetchApi, inBatches } from './pokeapi';
import type { Ability, Move, MoveCategory, PokemonDetails } from './types';

const LAST_DEX_ID = 1025;

/** "https://pokeapi.co/api/v2/version-group/25/" -> 25 */
const idFromUrl = (url: string) => Number(url.split('/').filter(Boolean).pop());

interface Named {
  name: string;
  url: string;
}

interface ApiPokemonDetails {
  id: number;
  abilities: { ability: Named; is_hidden: boolean; slot: number }[];
  moves: {
    move: Named;
    version_group_details: { level_learned_at: number; move_learn_method: Named; version_group: Named }[];
  }[];
}

interface ApiAbility {
  effect_entries: { short_effect: string; language: Named }[];
  flavor_text_entries: { flavor_text: string; language: Named }[];
  pokemon: { pokemon: Named }[];
}

interface ApiMove {
  type: Named;
  damage_class: Named;
  power: number | null;
  accuracy: number | null;
}

type AbilityInfo = Pick<Ability, 'effect' | 'holders'>;
type MoveInfo = Pick<Move, 'type' | 'category' | 'power' | 'accuracy'>;

const abilityMemo = new Map<string, Promise<AbilityInfo>>();
const moveMemo = new Map<string, Promise<MoveInfo>>();
const gameOrderMemo = new Map<string, Promise<number>>();

function memoised<T>(memo: Map<string, Promise<T>>, key: string, load: () => Promise<T>): Promise<T> {
  const cached = memo.get(key);
  if (cached) return cached;
  const promise = load();
  memo.set(key, promise);
  promise.catch(() => memo.delete(key)); // don't cache failures
  return promise;
}

const getAbility = (name: string) =>
  memoised(abilityMemo, name, async () => {
    const raw = await fetchApi<ApiAbility>(`ability/${name}`);
    const english = <E extends { language: Named }>(entries: E[]) => entries.filter((e) => e.language.name === 'en');
    // Newer abilities sometimes lack effect text; fall back to the latest
    // in-game description. Flavor text contains hard line breaks.
    const effect =
      english(raw.effect_entries)[0]?.short_effect ??
      english(raw.flavor_text_entries).at(-1)?.flavor_text.replace(/\s+/g, ' ') ??
      'No description yet.';
    // Alternate forms (Mega, regional...) have ids above 10000; count species only.
    const holders = raw.pokemon.filter((p) => idFromUrl(p.pokemon.url) <= LAST_DEX_ID).length;
    return { effect, holders };
  });

const getMove = (name: string) =>
  memoised(moveMemo, name, async () => {
    const raw = await fetchApi<ApiMove>(`move/${name}`);
    return {
      type: raw.type.name,
      category: raw.damage_class.name as MoveCategory,
      power: raw.power,
      accuracy: raw.accuracy,
    };
  });

/** Release order of a version group. Not its id: late additions like
 *  "blue-japan" (1996) got high ids. */
const getGameOrder = (name: string) =>
  memoised(gameOrderMemo, name, async () => (await fetchApi<{ order: number }>(`version-group/${name}`)).order);

export async function getPokemonDetails(id: number): Promise<PokemonDetails> {
  const raw = await fetchApi<ApiPokemonDetails>(`pokemon/${id}`);

  const abilities: Ability[] = await Promise.all(
    [...raw.abilities]
      .sort((a, b) => a.slot - b.slot)
      .map(async (a) => ({ name: a.ability.name, hidden: a.is_hidden, ...(await getAbility(a.ability.name)) })),
  );
  // Fewest holders wins; on a tie the earlier slot does.
  const signature = abilities.reduce((best, a) => (a.holders < best.holders ? a : best)).name;

  // A learnset differs per game. Use the newest game that teaches this
  // Pokémon anything by level-up.
  const levelUps = raw.moves.flatMap((m) =>
    m.version_group_details
      .filter((d) => d.move_learn_method.name === 'level-up')
      .map((d) => ({ name: m.move.name, level: d.level_learned_at, group: d.version_group.name })),
  );
  const groups = [...new Set(levelUps.map((m) => m.group))];
  const orders = await Promise.all(groups.map(getGameOrder));
  const newest = groups[orders.indexOf(Math.max(...orders))] ?? '';
  const learnset = levelUps
    .filter((m) => m.group === newest)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  const moves: Move[] = await inBatches(learnset, async (m) => ({ name: m.name, level: m.level, ...(await getMove(m.name)) }));

  return { id: raw.id, abilities, signature, moves, versionGroup: newest };
}
