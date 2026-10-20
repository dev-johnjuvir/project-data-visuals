# Data and caching

[← Wiki home](README.md)

Everything comes from [PokeAPI](https://pokeapi.co): free, no key, with a
fair-use policy (cache what you fetch, don't hammer it). Every request goes
through one helper, and every result is cached at least twice.

## The fetch helper: `fetchApi`

`lib/pokeapi.ts` → `fetchApi<T>(path)`

- GETs `https://pokeapi.co/api/v2/<path>` with `next: { revalidate: 86400 }`, so
  Next's data cache keeps the response for a day.
- **Retries** 429s, 5xx errors, timeouts (15s) and dropped connections up to 4
  attempts, with exponential backoff plus jitter (0.5s, 1s, 2s). A 404 throws a
  `PermanentError` right away.
- `inBatches(items, task)` runs at most **10 requests at once**. Use it for any list
  of fetches. Never `Promise.all` hundreds of requests.

## Region data (pages)

| Function | Used by | What it returns |
|---|---|---|
| `getPokemon(generation)` | charts page, OG images | One `Pokemon` per species in the region's dex range |
| `getPokemonWithForms(generation)` | Field Dex page | The same, plus the alternate forms that **play differently** |

Both memoise in memory per process, so building `/dex/1` after `/generation/1`
re-uses the same promise. A failed load is removed from the memo so the next
request retries.

### The `Pokemon` shape (`lib/types.ts`)

| Field | Note |
|---|---|
| `id` | PokeAPI's id. Unique per entry. **10001+ for alternate forms.** Use it for keys, selection and API calls |
| `species` | National dex number, shared by a species and all its forms. **Use it for anything shown to people** (`formatDexNumber(p.species)`) and for dex-number search |
| `name` | API name, e.g. `charizard-mega-x`. Display it with `formatName()` |
| `types`, `primaryType` | Slot order. `primaryType` drives the colour |
| `stats`, `total` | The six base stats and their sum |
| `sprite` | Best animated GIF (Showdown → B/W animated → still sprite) |
| `cry`, `height`, `weight` | Height in decimetres, weight in hectograms, as the API sends them |

### Alternate forms

`getAllForms()` lists every PokeAPI pokemon with an id above 10000 (one list call)
and fetches each one (about 300 requests, **once per build, shared by all
regions**). `getPokemonWithForms` then keeps a form only if its types or stats
differ from everything already kept for that species:

- **Kept:** megas, regional forms (Alolan Rattata), Zygarde 10%/Complete/Mega,
  Aegislash Blade, Pumpkaboo sizes.
- **Dropped:** cosmetic forms (Pikachu's caps) and Gigantamax (same base stats).
  Where two forms are identical, the shorter name wins (Zygarde 10% beats
  10% Power Construct).

The charts page deliberately **doesn't** include forms, so its averages and
histograms stay one-per-species.

## Per-entry details (on demand)

`/api/dex/[id]` → `getPokemonDetails(id)` in `lib/details.ts` (server only) returns
`PokemonDetails`:

| Field | Source | Notes |
|---|---|---|
| `abilities` | `/pokemon/{id}` + `/ability/{name}` | Effect text in English (falls back to the latest flavour text). `holders` counts **species**: form ids above 10000 aren't counted |
| `signature` | derived | The rarest ability (fewest holders). Ties go to the earlier slot |
| `moves`, `versionGroup` | `/pokemon/{id}` + `/move/{name}` + `/version-group/{name}` | Level-up moves from the **newest game by release `order`** (not by id; see [Gotchas](gotchas.md)) |
| `evolution` | `/pokemon-species` + `/evolution-chain` | Stages breadth-first. Each member has a condition string ("Lv 16", "Fire Stone", "Trade holding Metal Coat") |
| `forms` | species `varieties` + `/pokemon/{variety}` | Every variety, default first, with label, types, total and a `mega` flag |

Rules worth knowing:

- **Megas use their base form's moves.** PokeAPI only has Mega learnsets for the
  Let's Go games. Any other form without moves also falls back to the base.
  Regional forms keep their own learnsets.
- **Forms have no species record of their own.** The species is found through
  `raw.species.url`, not by id.
- Abilities, moves, version groups and evolution chains are **memoised per name**
  for the life of the server process. Many Pokémon share them, so browsing a
  region re-uses most lookups.

### Route caching

```ts
export const revalidate = 86400;
export function generateStaticParams() { return []; }
```

The empty `generateStaticParams` makes each id an ISR page: built on first
request, cached for a day, and **not** prebuilt (that would cost thousands of
requests per build). The route accepts dex numbers 1–1025 and form ids
10001–10999; anything else returns 404.

On a PokeAPI failure the route **throws** instead of returning an error body:
thrown errors are never cached, so the next request just tries again.

### Client cache

`hooks/usePokemonDetails.ts` keeps one promise per id in a module-level `Map` for
the life of the tab. Flipping between INFO and SKILLS, or coming back to an entry,
re-uses it. Failures are removed from the map, and the hook exposes `retry()`. A
`current` flag ignores slow responses for an entry you've already left.

## Cost and limits

The site is on **Vercel Hobby** (free, no card, so no overage bills; exceeding a
limit pauses the project until it resets). Keep it that way:

- Every PokeAPI call goes through `fetchApi`, so it's in the data cache for a day.
- New per-entry data belongs in `getPokemonDetails` (fetched on demand), not in the
  page payload. New region-wide data must be fetched in batches.
- Each `/api/dex/[id]` request counts as a function invocation, even when cached.
  The client cache keeps repeats to one per entry per tab.
- When adding requests, note the build-time and runtime impact in the PR.
