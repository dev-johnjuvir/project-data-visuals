// Server-only: build one entry's abilities and level-up moves from PokeAPI.
// Abilities and moves are shared across many Pokémon, so their lookups are
// memoised per name - browsing a whole region refetches very little.

import { fetchApi, inBatches, toPokemon, type ApiPokemon } from './pokeapi';
import { capitalize, formatName } from './transforms';
import type { Ability, EvolutionMember, LoreEntry, Move, MoveCategory, PokemonDetails, PokemonForm } from './types';

const LAST_DEX_ID = 1025;

/** "https://pokeapi.co/api/v2/version-group/25/" -> 25 */
const idFromUrl = (url: string) => Number(url.split('/').filter(Boolean).pop());

interface Named {
  name: string;
  url: string;
}

interface ApiPokemonDetails {
  name: string;
  id: number;
  species: Named;
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

interface ApiSpecies {
  name: string;
  evolution_chain: { url: string } | null;
  varieties: { is_default: boolean; pokemon: Named }[];
  genera: { genus: string; language: Named }[];
  flavor_text_entries: { flavor_text: string; language: Named; version: Named }[];
}

/** Game names with their own capitalisation. */
const GAME_WORDS: Record<string, string> = {
  lets: "Let's",
  firered: 'FireRed',
  leafgreen: 'LeafGreen',
  heartgold: 'HeartGold',
  soulsilver: 'SoulSilver',
};

/** "lets-go-pikachu" -> "Let's Go Pikachu", "omega-ruby" -> "Omega Ruby" */
const formatVersion = (name: string) =>
  name
    .split('-')
    .map((word) => GAME_WORDS[word] ?? capitalize(word))
    .join(' ');

/** "generation-viii" -> "VIII" */
const generationNumeral = (name: string) => name.replace('generation-', '').toUpperCase();

/**
 * The species' Pokédex entries, condensed to one per generation, newest
 * first: each generation keeps its latest text and lists every game of that
 * generation with an entry. Old games wrap text with hard line breaks and
 * form feeds and spell it "POKéMON"; those are tidied.
 */
async function toLore(species: ApiSpecies): Promise<LoreEntry[]> {
  const english = species.flavor_text_entries.filter((e) => e.language.name === 'en');
  const generations = await Promise.all(english.map((e) => getVersionGeneration(e.version.name)));

  // The API lists entries in release order, so a later entry overwrites an
  // earlier one of the same generation: each generation ends on its newest.
  const byGeneration = new Map<string, { games: string[]; text: string }>();
  english.forEach((entry, i) => {
    const generation = generations[i];
    const text = entry.flavor_text
      // A soft hyphen marks a word split across lines ("anger-ed"): rejoin it.
      .replace(/\u00ad\s*/g, '')
      .replace(/[\f\n\r]+/g, ' ')
      .replace(/POKéMON/g, 'Pokémon')
      .replace(/\s+/g, ' ')
      .trim();
    const games = byGeneration.get(generation)?.games ?? [];
    byGeneration.set(generation, { games: [...games, formatVersion(entry.version.name)], text });
  });
  return [...byGeneration]
    .map(([generation, { games, text }]) => ({ generation, games, text }))
    .reverse();
}

/** One way to evolve. Only the fields we describe; all optional in practice. */
interface ApiEvolutionDetail {
  trigger: Named;
  is_default?: boolean;
  min_level: number | null;
  item: Named | null;
  held_item: Named | null;
  known_move: Named | null;
  known_move_type: Named | null;
  min_happiness: number | null;
  min_affection: number | null;
  time_of_day: string;
  location: Named | null;
  near_special_rock?: boolean;
}

interface ApiChainLink {
  species: Named;
  evolution_details: ApiEvolutionDetail[];
  evolves_to: ApiChainLink[];
}

type AbilityInfo = Pick<Ability, 'effect' | 'holders'>;
type MoveInfo = Pick<Move, 'type' | 'category' | 'power' | 'accuracy'>;

const abilityMemo = new Map<string, Promise<AbilityInfo>>();
const moveMemo = new Map<string, Promise<MoveInfo>>();
const versionGroupMemo = new Map<string, Promise<{ order: number; generation: string }>>();
const versionMemo = new Map<string, Promise<string>>();
const chainMemo = new Map<string, Promise<EvolutionMember[][]>>();

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
/** A game group's release order and generation numeral. Order, not id:
 *  late additions like "blue-japan" (1996) got high ids. */
const getVersionGroup = (name: string) =>
  memoised(versionGroupMemo, name, async () => {
    const raw = await fetchApi<{ order: number; generation: Named }>(`version-group/${name}`);
    return { order: raw.order, generation: generationNumeral(raw.generation.name) };
  });

const getGameOrder = async (name: string) => (await getVersionGroup(name)).order;

/** Pokédex entries are tagged by single game ("red"); its group knows the generation. */
const getVersionGeneration = (version: string) =>
  memoised(versionMemo, version, async () => {
    const raw = await fetchApi<{ version_group: Named }>(`version/${version}`);
    return (await getVersionGroup(raw.version_group.name)).generation;
  });

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

/** "Lv 16", "Fire Stone", "Trade holding Metal Coat", "Friendship, Day"... */
function describeEvolution(details: ApiEvolutionDetail[]): string | null {
  // One entry per game that changed the method; prefer the canonical one.
  const d = details.find((x) => x.is_default) ?? details.at(-1);
  if (!d) return null;
  const parts: string[] = [];
  if (d.trigger.name === 'trade') parts.push('Trade');
  if (d.min_level) parts.push(`Lv ${d.min_level}`);
  if (d.item) parts.push(formatName(d.item.name));
  if (d.held_item) parts.push(`holding ${formatName(d.held_item.name)}`);
  if (d.min_happiness) parts.push('Friendship');
  if (d.min_affection) parts.push('Affection');
  if (d.known_move) parts.push(`knows ${formatName(d.known_move.name)}`);
  if (d.known_move_type) parts.push(`knows a ${capitalize(d.known_move_type.name)} move`);
  if (d.time_of_day) parts.push(capitalize(d.time_of_day));
  if (d.location || d.near_special_rock) parts.push('special place');
  // Nothing we know how to phrase (e.g. Shedinja's "shed"): name the trigger.
  return parts.length ? parts.join(', ') : formatName(d.trigger.name);
}

/** Flatten the chain tree into stages, breadth first. */
function toStages(root: ApiChainLink): EvolutionMember[][] {
  const stages: EvolutionMember[][] = [];
  let level = [root];
  while (level.length) {
    stages.push(
      level
        .map((link) => ({ link, id: idFromUrl(link.species.url) }))
        // Skip species newer than the dex this app covers.
        .filter(({ id }) => id <= LAST_DEX_ID)
        .map(({ link, id }) => ({
          id,
          name: link.species.name,
          sprite: `${SPRITE_BASE}/${id}.png`,
          condition: stages.length ? describeEvolution(link.evolution_details) : null,
        })),
    );
    level = level.flatMap((link) => link.evolves_to);
  }
  return stages.filter((stage) => stage.length > 0);
}

/** Every member of a line shares one chain, so it's fetched once per line. */
const getEvolution = async (species: ApiSpecies) => {
  const url = species.evolution_chain?.url;
  if (!url) return [];
  return memoised(chainMemo, url, async () =>
    toStages((await fetchApi<{ chain: ApiChainLink }>(`evolution-chain/${idFromUrl(url)}`)).chain),
  );
};

/** "charizard-mega-x" -> "Mega X", "zygarde-10-power-construct" -> "10% Power Construct" */
function formLabel(species: string, name: string): string {
  const rest = name.startsWith(`${species}-`) ? name.slice(species.length + 1) : name === species ? '' : name;
  if (!rest) return 'Standard';
  return rest
    .split('-')
    .map((word) => (/^\d+$/.test(word) ? `${word}%` : word === 'gmax' ? 'Gigantamax' : capitalize(word)))
    .join(' ');
}

/** Each variety is its own /pokemon record, with its own types and stats. */
async function getForms(species: ApiSpecies): Promise<PokemonForm[]> {
  // Default first, then in the API's order (megas and regionals tend to group).
  const varieties = [...species.varieties].sort((a, b) => Number(b.is_default) - Number(a.is_default));
  return inBatches(varieties, async (v) => {
    const form = toPokemon(await fetchApi<ApiPokemon>(`pokemon/${v.pokemon.name}`));
    return {
      name: v.pokemon.name,
      label: formLabel(species.name, v.pokemon.name),
      sprite: form.sprite,
      types: form.types,
      total: form.total,
      isDefault: v.is_default,
      mega: v.pokemon.name.includes('-mega'),
    };
  });
}

/** The newest game's level-up learnset, by level then name. */
async function getLearnset(raw: ApiPokemonDetails): Promise<{ moves: Move[]; versionGroup: string }> {
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

  const moves = await inBatches(learnset, async (m) => ({ name: m.name, level: m.level, ...(await getMove(m.name)) }));
  return { moves, versionGroup: newest };
}

/** `id` is PokeAPI's: a dex number, or 10001+ for an alternate form. */
export async function getPokemonDetails(id: number): Promise<PokemonDetails> {
  const raw = await fetchApi<ApiPokemonDetails>(`pokemon/${id}`);
  // Forms have no species record of their own; go through the link.
  const species = await fetchApi<ApiSpecies>(`pokemon-species/${idFromUrl(raw.species.url)}`);
  const [evolution, forms] = await Promise.all([getEvolution(species), getForms(species)]);

  const abilities: Ability[] = await Promise.all(
    [...raw.abilities]
      .sort((a, b) => a.slot - b.slot)
      .map(async (a) => ({ name: a.ability.name, hidden: a.is_hidden, ...(await getAbility(a.ability.name)) })),
  );
  // Fewest holders wins; on a tie the earlier slot does.
  const signature = abilities.reduce((best, a) => (a.holders < best.holders ? a : best)).name;

  // A Mega knows its base form's moves - the API only lists Mega learnsets
  // for Let's Go, an old game. Other forms with no learnset of their own do
  // the same. Regional forms (Alolan Rattata) keep theirs: they really differ.
  const base = species.varieties.find((v) => v.is_default)?.pokemon.name;
  let learnset = raw.name.includes('-mega') ? null : await getLearnset(raw);
  if (!learnset?.moves.length && base && base !== raw.name) {
    learnset = await getLearnset(await fetchApi<ApiPokemonDetails>(`pokemon/${base}`));
  }
  learnset ??= await getLearnset(raw);

  const lore = await toLore(species);
  const genus = species.genera.find((g) => g.language.name === 'en')?.genus ?? '';
  return { id: raw.id, genus, lore, forms, evolution, abilities, signature, ...learnset };
}
