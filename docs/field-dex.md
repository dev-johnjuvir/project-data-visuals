# Field Dex

[← Wiki home](README.md)

The handheld Pokédex at `/dex/[gen]`. The server page loads
`getPokemonWithForms(generation)` and renders `<FieldDex key={generation.id}>`.
The `key` resets every bit of device state when you switch region.

## Component tree

```
FieldDex (client root: all state lives here)
├── top bar: model name, LEDs, sound toggle, Charts link
├── DexScreen: the bezel + LCD
│   ├── head: SpriteScreen, number, name, type chips, CryButton
│   ├── tab buttons
│   └── body (the only part that scrolls), one of:
│       StatsTab    radar (StatRadar) + traffic-light bars
│       InfoTab     fact cards → DetailsTab → EvolutionLine, FormList, Abilities
│       SkillsTab   DetailsTab → level-up move table
│       RankTab     region/type rank, "outscores", nearest by total
│       VsTab       rival picker, overlaid radar, butterfly bars, verdict
├── D-pad, A/B buttons, first/last jumps
└── DexSearchList: search box, type filter, DexEntry list
```

`DetailsTab` is a loading, error and ready wrapper around `usePokemonDetails`.
Anything that needs `/api/dex/[id]` data renders through it.

## State (all in `FieldDex`)

| State | Notes |
|---|---|
| `selectedId` | The entry on screen. Starts on Pikachu if the region has it, otherwise the first entry |
| `tab` | One of `TABS` (`DexScreen.tsx`): `stats`, `info`, `skills`, `rank`, `vs` |
| `query`, `typeFilter` | List search and filter. They **don't** change the selection, and browsing still walks the whole region |
| `rivalId` | VS opponent. Starts on the next *species* (Pikachu → Raichu) and stays put while you browse |

Every control goes through a small handler that plays its sound and sets state:
`select` (choose an entry), `jump` (first/last), `browse` (±1 entry, wraps),
`changeTab` / `switchTab`, `changeType`, `changeRival`, `swap`, `random`. Pass
these down as props, never the raw `setState`, so the sounds stay consistent.

## Controls

| Input | Action |
|---|---|
| D-pad ↑↓ / arrow keys | Previous / next entry (wraps) |
| D-pad ←→ / arrow keys, A | Previous / next tab (A = next) |
| B | Random entry (never the current one) |
| `#first` / `#last` | Jump to the first / last entry |
| List, Rank neighbours, evolution and form cards | Select that entry |

Arrow keys work anywhere inside the device **except** inputs and selects, where
arrows already have a job (`onKeyDown` in `FieldDex`).

## The tabs

- **STATS:** a radar for shape plus bars for exact values. The bars use
  traffic-light bands: high ≥ 90, mid ≥ 60, low below that, on a fixed 0–255 scale.
- **INFO:** height, weight, typing, best and lowest stat, total. Then, once loaded:
  - the **evolution line**, left to right with ▶ between stages. A split stage
    stacks, and a big branch (Eevee's eight) becomes a two-column grid. Cards are
    highlighted by *species*, so a Mega lights up its base form.
  - **forms**, with the change in total against the default form.
  - **abilities**, signature first.
- **SKILLS:** the level-up table (Lv, move with type and category, power,
  accuracy). Level 0 shows as "Evo" (learned on evolution).
- **RANK:** rank by base total in the region and within the primary type, the
  share it outscores, and up to four nearest neighbours by total.
- **VS:** see below.

### VS (comparing two Pokémon)

- `compareStats(left, right)` in `lib/dex.ts` returns the winner of each stat, the
  totals and the win counts.
- **Butterfly bars:** the selected Pokémon grows left and the rival right, both on
  a fixed 0–255 scale. The loser's bar fades and the winner's number is underlined.
- **Overlaid radar** (`StatRadar` with `rival`): the selected Pokémon is solid; the
  rival is see-through with a dashed outline. The dash, not just the colour, tells
  them apart, so two Fire types still read clearly.
- **Swap** exchanges selected and rival.

## Layout

One CSS grid (`_field-dex.scss`) with two arrangements, swapped with
`grid-template-areas`:

```
stacked (< 1100px)        landscape (>= 1100px)
top    top                top  top     top   top
screen screen             pad  screen  list  buttons
pad    buttons
list   list
```

- The **LCD has a fixed height** (540px, or 580px wide) like real hardware. Only
  `.dex-screen__body` scrolls, with a hidden scrollbar and a fade at the bottom
  edge.
- **Landscape, equal frame heights:** the screen sets the row height. The list
  column uses `contain: size`, so the list counts as zero height when the row is
  sized, then stretches to match the screen and scrolls inside. The screen column
  is 1.4× wider so STATS can fit its radar and bars side by side. Don't
  "simplify" this; see [Gotchas](gotchas.md#a-long-list-stretches-the-screen).
- Tabs: a 3-column grid on phones, one row of 5 from 600px.

## Performance notes

- Region data arrives with the page. Details are fetched per entry, only when
  INFO or SKILLS opens.
- Sprites load one at a time for the entry on screen. Cries download only when
  **Cry** is pressed.
- `DexScreen`'s body has `key={tab-id}` for a fresh scroll position on every tab
  and entry. The sprite and cry button are keyed by entry so their state resets.
