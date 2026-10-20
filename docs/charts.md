# Charts dashboard

[← Wiki home](README.md)

`/generation/[gen]`: five readouts on one region. What each chart teaches is
covered in the [project README](../README.md#the-readouts-and-what-each-one-teaches),
and in the `// Lesson:` comment at the top of each file in
`components/charts/`. This page covers how the dashboard is wired.

## Data and state

- The page fetches `getPokemon(generation)`: **species only, no alternate forms**,
  so averages are one-per-species. It renders `<Dashboard>`.
- `Dashboard` (client) owns the two pieces of shared state:
  - `highlight`: the type picked in `TypeFilter`, a share row or a heatmap row.
    Every other type dims everywhere.
  - `selectedId`: the scanned entry. The Dex list, a scatter dot and the ◀ ▶
    buttons set it. The scanner, the scatter ring and the histogram's ringed bin
    follow it.
- Derived data is computed once per dataset with `useMemo`, using functions from
  `lib/transforms.ts`: `countByPrimaryType`, `averageStatsByType`, `meanStats`,
  `binStatTotals`.

## Readouts

| Component | Built from | Notes |
|---|---|---|
| `StatTile` | counts, max | The number is the chart |
| `TypeShareBars` | `countByPrimaryType` | Scaled to the largest type, not to 100% |
| `AttackDefenseScatter` | raw records | Dots are `<button>`s placed with `left`/`top` percentages. Axes start at 0 and round up to a clean step |
| `StatTotalHistogram` | `binStatTotals` | Fixed bins of 25 from 175 to 725, the same for every region so shapes compare |
| `StatScanner` + `StatCompareChart` | selected + `meanStats` | Bar plus average tick on a fixed 0–255 scale |
| `TypeStatHeatmap` | `averageStatsByType` | One hue, light to dark. Text flips to white on dark cells |

Every chart except the scatter has a **table view** (`ui/DataTable.tsx`), so no value
depends on hovering.

## Why HTML and CSS, not SVG

Positions and sizes are percentages computed from data, so the server renders each
chart at its final size, at any width, with no measuring, no layout shift and no
client-side chart library. D3 is only used for maths. The one SVG in the project
is the Field Dex radar, where the shape needs polygons.
