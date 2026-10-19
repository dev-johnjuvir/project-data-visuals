# Dex Data Visuals

A learning project: five data readouts on every generation of Pokémon, built from the
[PokeAPI](https://pokeapi.co) with Next.js (App Router), D3 for the math, and Sass + BEM
for a retro handheld-Pokédex look.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (fetches all 1,025 Pokémon once)
```

## How data flows

0. Each generation has its own URL: `/generation/1` … `/generation/9` (`/` redirects to Gen I).
   `src/lib/generations.ts` maps a generation to its Pokédex range, and
   `generateStaticParams` pre-builds all nine pages at build time.
1. `src/lib/pokeapi.ts` fetches that generation's Pokémon **on the server** (with retries,
   since 1,025 requests to a free API will occasionally hit a dropped connection) and slims
   each record to the fields we chart (`src/lib/types.ts`).
2. `src/lib/transforms.ts` turns records into chart-ready rows. Charts never compute,
   they only draw.
3. `src/components/Dashboard.tsx` owns the two pieces of shared state, the **highlighted type**
   and the **scanned entry**, and passes them to every readout.

## The readouts and what each one teaches

| # | Component | Question it answers | Lesson |
|---|---|---|---|
| – | `StatTile` | "How many? What's the max?" | When the story is one number, the number *is* the chart |
| 01 | `TypeShareBars` | Which types are most common? | Ranked bars beat pies for many categories; scale to the largest, label the exact value |
| 02 | `AttackDefenseScatter` | Do attack and defense go together? | Relationships between two measures; dots are real buttons, so it works by keyboard |
| 03 | `StatTotalHistogram` | How are power levels distributed? | Distribution shape; bin width is a design choice |
| 04 | `StatScanner` + `StatCompareChart` | How does one Pokémon compare to the average? | Bar + marker on a fixed 0–255 scale |
| 05 | `TypeStatHeatmap` | Which types are strong at which stats? | Sequential color (one hue, light→dark) plus a scale legend |

Interaction rules applied throughout:

- **One filter, every readout.** The type chips (and tapping a share row or heatmap type)
  dim every other type everywhere: the list, the dots, the bars, the heatmap rows.
- **Linked selection.** Tap an entry in the Dex list or a scatter dot, or use ◀ ▶, and the scanner,
  the scatter target ring and the histogram's ringed bin all follow.
- **Every chart has a table view** (except the scatter, whose dots are labelled buttons),
  so exact values never depend on hovering.

## SSR and loading states

- **Charts are HTML + CSS, not SVG.** Positions and sizes are percentages computed from the
  data (`left`, `top`, `height`, `width`), so the server renders every chart at its final size,
  at any screen width, with no measuring and no layout shift.
- **Switching generations** keeps the current readouts on screen, dimmed, and shows a
  spinner on the pressed region key (`useLinkStatus` + a CSS `:has()` selector).
- **First visit in `npm run dev`** shows a spinner panel while the server fetches
  from the PokeAPI (a `<Suspense>` boundary). Production pages are pre-built, so that
  boundary is skipped there and the HTML stays complete, even without JavaScript.

## Styling: Sass + BEM

```
src/styles/
  abstracts/_tokens.scss   Sass maps → CSS custom properties (palette + 18 type colors)
  abstracts/_mixins.scss   hard-card, screen, pressable/pressed, pixel, label, focus-ring
  base/_base.scss          dotted page background, fonts
  components/_<block>.scss one file per BEM block
  main.scss                imports everything, in order
```

BEM naming is `block__element--modifier`, for example `scatter__dot--selected` and
`dex-list__entry--dimmed`. React only toggles class names and sets a few CSS custom
properties from the data (see `src/lib/style.ts`):

```tsx
<span className="type-dot" style={{ '--type-color': 'var(--type-fire)' }} />
```
```scss
.type-dot { background: var(--type-color); }
```

The look comes from three mixins used everywhere: `hard-card` (thick ink outline + hard
offset shadow), `screen` (the pale-green LCD inset), and `pressable`/`pressed` (buttons that
sink into the page when active). Fonts (Pixelify Sans, Press Start 2P, M PLUS Rounded 1c) are
self-hosted by `next/font`.

## Ideas to level up

- Add an "All generations" view, then think about how each readout copes with 1,025 Pokémon
- Add small multiples: one mini histogram per type
- Animate the scatter dots between generations with CSS transitions on `left` / `top`
- Add arrow-key navigation through the Dex list
