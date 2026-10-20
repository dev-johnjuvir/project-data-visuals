import { generationSize, type Generation } from './generations';
import { STAT_KEYS, type Pokemon, type StatKey } from './types';

const API_BASE = 'https://pokeapi.co/api/v2';
const ONE_DAY = 60 * 60 * 24;
/** Requests in flight at once - PokeAPI is free, so be polite. */
const BATCH_SIZE = 10;
/** Attempts per Pokémon before giving up (1 try + 3 retries). */
const MAX_ATTEMPTS = 4;
/** A request that hangs longer than this is aborted and retried. */
const TIMEOUT_MS = 15_000;

// Only the fields we read. The real response is much larger (moves, games...).
interface ApiPokemon {
  id: number;
  name: string;
  types: { slot: number; type: { name: string } }[];
  stats: { base_stat: number; stat: { name: string } }[];
  height: number;
  weight: number;
  cries?: { latest: string | null; legacy: string | null };
  sprites: {
    front_default: string | null;
    other?: { showdown?: { front_default: string | null } };
    versions?: { 'generation-v'?: { 'black-white'?: { animated?: { front_default: string | null } } } };
  };
}

/**
 * Best available sprite, most animated first:
 *  1. Showdown GIFs - nearly every Pokémon through Gen IX
 *  2. Black/White animated GIFs - Gen I-V only
 *  3. The still front sprite - always present
 */
function pickSprite(sprites: ApiPokemon['sprites']): string | null {
  return (
    sprites.other?.showdown?.front_default ??
    sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default ??
    sprites.front_default
  );
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
    sprite: pickSprite(raw.sprites),
    // Every Pokémon has a modern "latest" cry; the original 8-bit "legacy"
    // ones exist only for older generations.
    cry: raw.cries?.latest ?? raw.cries?.legacy ?? null,
    height: raw.height,
    weight: raw.weight,
  };
}

/** Thrown for responses that will never succeed, like a 404, so we don't retry them. */
class PermanentError extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * GET one PokeAPI resource, retrying transient failures.
 *
 * The build makes 1,025 requests to a free public API. A dropped connection
 * (ECONNRESET), a timeout, a 429 rate limit or a 5xx will happen eventually,
 * and without retries one blip fails the whole deploy. We retry with
 * exponential backoff (0.5s, 1s, 2s) plus random jitter, so parallel
 * requests that failed together don't all retry at the same instant.
 */
export async function fetchApi<T>(path: string): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/${path}`, {
        next: { revalidate: ONE_DAY },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) {
        const message = `PokeAPI returned ${res.status} for ${path}`;
        const retryable = res.status === 429 || res.status >= 500;
        throw retryable ? new Error(message) : new PermanentError(message);
      }
      // Inside the try: the connection can also drop while the body streams in.
      return (await res.json()) as T;
    } catch (error) {
      if (error instanceof PermanentError || attempt >= MAX_ATTEMPTS) throw error;
      const delay = 500 * 2 ** (attempt - 1) + Math.random() * 250;
      console.warn(`PokeAPI ${path} failed (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
}

/** Run `task` over `items`, at most BATCH_SIZE requests in flight at once. */
export async function inBatches<T, R>(items: T[], task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    results.push(...(await Promise.all(items.slice(i, i + BATCH_SIZE).map(task))));
  }
  return results;
}

const fetchPokemon = async (id: number) => toPokemon(await fetchApi<ApiPokemon>(`pokemon/${id}`));

// Keep the slimmed result in memory so dev reloads don't refetch every record.
const memo = new Map<number, Promise<Pokemon[]>>();

/** Fetch every Pokémon in a generation's Pokédex range, in small batches. */
export function getPokemon(generation: Generation): Promise<Pokemon[]> {
  const cached = memo.get(generation.id);
  if (cached) return cached;

  const load = (async () => {
    const ids = Array.from({ length: generationSize(generation) }, (_, i) => generation.first + i);
    return inBatches(ids, fetchPokemon);
  })();

  memo.set(generation.id, load);
  load.catch(() => memo.delete(generation.id)); // don't cache failures
  return load;
}
