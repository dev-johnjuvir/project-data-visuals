# Dex Data Visuals: developer wiki

How the project works under the hood, and how to change it without breaking
anything. The [project README](../README.md) covers what the charts teach and the
quick start; this wiki covers the rest.

## Pages

| Page | Read it when you want to... |
|---|---|
| [Architecture](architecture.md) | See the routes, the server/client split and how a page is put together |
| [Data and caching](data-and-caching.md) | Change what's fetched from PokeAPI, or understand when it's refetched |
| [Field Dex](field-dex.md) | Work on the handheld Pokédex: its state, tabs, controls and layout |
| [Charts dashboard](charts.md) | Work on the `/generation/[gen]` readouts |
| [Styling](styling.md) | Add or change styles (Sass, BEM, tokens, the data-to-CSS bridge) |
| [Sound](sound.md) | Tune or add the 8-bit UI sounds |
| [Recipes](recipes.md) | Step-by-step: add a tab, a sound, a data field, a chart |
| [Gotchas](gotchas.md) | Traps this codebase has already fallen into (read before debugging) |

## The project in one minute

- **Next.js 16 App Router + TypeScript.** Pages are Server Components that fetch on
  the server. Interactive parts are client components.
- **Data:** [PokeAPI](https://pokeapi.co), free and with no API key. All of it is
  slimmed on the server before it reaches the browser.
- **Two apps in one:**
  - `/generation/1`…`/9`: a charts dashboard per region. `/` redirects to Gen I.
  - `/dex/1`…`/9`: the **Field Dex**, a retro handheld Pokédex.
- **No chart library.** D3 is used only for the maths (`mean`, `rollups`, ...).
  Charts are plain HTML and CSS positioned with percentages.
- **Styling:** Sass + BEM, one file per block, plus design tokens emitted as CSS
  custom properties.
- **Hosting:** Vercel Hobby (free). Keep PokeAPI traffic cached and polite; see
  [Data and caching](data-and-caching.md#cost-and-limits).

```bash
npm install
npm run dev         # http://localhost:3000
npm run typecheck   # tsc --noEmit (no test suite yet; this is the safety net)
npm run build       # production build: fetches every Pokémon and form once
```

## File map

```
src/
  app/
    page.tsx                      / -> redirect to /generation/1
    generation/[gen]/             charts dashboard page + its link-preview image
    dex/[gen]/                    Field Dex page + its link-preview image
    api/dex/[id]/route.ts         per-entry abilities, moves, evolution, forms (JSON)
    layout.tsx, manifest.ts, icon.svg, apple-icon.tsx, error.tsx
  components/
    Dashboard.tsx + charts/       the charts page (client)
    dex/                          the Field Dex (client)
    ui/                           shared bits: Spinner, TypeDot, SpriteScreen, CryButton...
  hooks/                          useScrollToSelected, usePokemonDetails
  lib/
    pokeapi.ts                    fetching: retries, batching, region lists, forms
    details.ts                    server-only: one entry's abilities/moves/evolution/forms
    types.ts                      every shared data shape
    transforms.ts, dex.ts         pure data shaping (charts / Field Dex)
    style.ts                      data -> CSS custom properties
    sfx.ts                        8-bit sound effects + mute state
    generations.ts, metadata.ts, og*.tsx, brand.ts
  styles/                         Sass: abstracts/, base/, components/, main.scss
docs/                             this wiki
```
