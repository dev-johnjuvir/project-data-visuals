# Pokédex Data Visuals

A learning project: five charts built from the [PokeAPI](https://pokeapi.co) with
Next.js (App Router), D3 for the math, React for the SVG, and Sass + BEM for styling.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (fetches all 151 Pokémon once)
```

## How data flows

0. Each generation has its own URL: `/generation/1` … `/generation/9` (`/` redirects to Gen I).
   `src/lib/generations.ts` maps a generation to its Pokédex range, and
   `generateStaticParams` pre-builds all nine pages at build time.
1. `src/lib/pokeapi.ts` fetches that generation's Pokémon **on the server** and slims each
   record to the fields we chart (`src/lib/types.ts`).
2. `src/lib/transforms.ts` turns records into chart-ready rows. Charts never compute,
   they only draw.
3. `src/components/Dashboard.tsx` holds the shared filter state and passes it down to every chart.

## SSR and loading states

- **Charts render on the server.** The server can't measure a container, so
  `useElementWidth` starts at a default width and `ChartSvg` uses a `viewBox` to scale
  that drawing to fit. On the client, `useLayoutEffect` measures the real width before
  the first paint. Charts are never blank, and cards never jump in height.
- **Switching generations** keeps the current charts on screen, dimmed, and shows a
  spinner on the clicked option (`useLinkStatus` + a CSS `:has()` selector). This avoids a blank flash.
- **First visit in `npm run dev`** shows a spinner panel while the server fetches
  from the PokeAPI (a `<Suspense>` boundary). Production pages are pre-built, so that
  boundary is skipped there and the HTML stays complete, even without JavaScript.

## The charts and what each one teaches

| Chart | Question it answers | Lesson |
|---|---|---|
| Stat tiles | "How many? What's the max?" | When the story is one number, the number *is* the chart |
| `TypeCountChart` | Which types are most common? | Ranked horizontal bars for comparing categories |
| `AttackDefenseScatter` | Do attack and defense go together? | Relationships; Delaunay nearest-point hover |
| `StatTotalHistogram` | How are power levels distributed? | Distribution shape; bin width is a design choice |
| `StatCompareChart` | How does one Pokémon compare to the average? | Grouped bars on a shared, fixed scale (instead of a radar chart) |
| `TypeStatHeatmap` | Which types are strong at which stats? | Sequential color (one hue, light→dark) plus a scale legend |

Design rules applied throughout:

- **Color follows meaning.** Blue is the main series and orange the comparison series.
  Gray means "not highlighted". Both colors are checked for colorblind separation in light and dark mode.
- **Highlight, don't rainbow.** Picking a type paints that type in blue and grays out
  the rest, instead of giving 15 types 15 colors.
- **Every chart has a table view**, so you never need the tooltip to read a value.
- **Hit targets are bigger than the marks.** Whole rows are hoverable, and the scatter snaps to the nearest dot.
- **Thin marks, hairline grids, labels only where they help.**

## Styling: Sass + BEM

```
src/styles/
  abstracts/_tokens.scss   Sass maps → CSS custom properties (light + dark)
  abstracts/_mixins.scss   space(), from(), dark, card, focus-ring
  base/_base.scss
  components/_<block>.scss one file per BEM block
  main.scss                imports everything, in order
```

BEM naming is `block__element--modifier`, for example `chart__bar--muted` and
`heatmap__cell--step-3`. React only toggles class names. Every visual decision lives in Sass.
The heatmap's seven color steps are generated with a Sass `@for` loop, and dark mode
runs the ramp in reverse so low values blend into the dark background.

## Ideas to level up

- Add an "All generations" view, then think about how each chart copes with 1,025 Pokémon
- Add small multiples: one mini histogram per type
- Animate transitions between Pokémon with `d3-transition` or CSS
- Add keyboard navigation to the scatter (arrow keys move between dots)
