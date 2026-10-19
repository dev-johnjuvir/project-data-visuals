import { generationSize, type Generation } from './generations';
import { STAT_KEYS, type Pokemon, type StatKey } from './types';

const API_BASE = 'https://pokeapi.co/api/v2';
const ONE_DAY = 60 * 60 * 24;
/** Requests in flight at once - PokeAPI is free, so be polite. */
const BATCH_SIZE = 20;

// Only the fields we read. The real response is much larger (moves, games...).
interface ApiPokemon {
  id: number;
  name: string;
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  sprites: {
    front_default: string | null;
    other?: { 'official-artwork'?: { front_default: string | null } };
  };
}

function toPokemon(raw: ApiPokemon): Pokemon {
  const types = [...raw.types].sort((a, b) => a.slot - b.slot).map((t) => t.type.name);
  const stats = Object.fromEntries(
    STAT_KEYS.map((key) => [key, raw.stats.find((s) => s.stat.name === key)?.base_stat ?? 0]),
  ) as Record<StatKey, number>;

  return {
    id: raw.id,
    name: raw.name,
    types,
    primaryType: types[0],
    stats,
    total: STAT_KEYS.reduce((sum, key) => sum + stats[key], 0),
    sprite: raw.sprites.other?.['official-artwork']?.front_default ?? raw.sprites.front_default,
  };
}

async function fetchPokemon(id: number): Promise<Pokemon> {
  const res = await fetch(`${API_BASE}/pokemon/${id}`, { next: { revalidate: ONE_DAY } });
  if (!res.ok) throw new Error(`PokeAPI returned ${res.status} for Pokémon #${id}`);
  return toPokemon(await res.json());
}

// Keep the slimmed result in memory so dev reloads don't refetch every record.
const memo = new Map<number, Promise<Pokemon[]>>();

/** Fetch every Pokémon in a generation's Pokédex range, in small batches. */
export function getPokemon(generation: Generation): Promise<Pokemon[]> {
  const cached = memo.get(generation.id);
  if (cached) return cached;

  const load = (async () => {
    const ids = Array.from({ length: generationSize(generation) }, (_, i) => generation.first + i);
    const results: Pokemon[] = [];
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      results.push(...(await Promise.all(ids.slice(i, i + BATCH_SIZE).map(fetchPokemon))));
    }
    return results;
  })();

  memo.set(generation.id, load);
  load.catch(() => memo.delete(generation.id)); // don't cache failures
  return load;
}
