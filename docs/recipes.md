# Recipes

[← Wiki home](README.md)

Step-by-step guides for common changes. Run `npm run typecheck` after each one.
It's the project's only automated check.

## Add a Field Dex tab

1. Add the name to `TABS` in `components/dex/DexScreen.tsx`. The order there is the
   order of the buttons, the D-pad and A.
2. Render it in the body: `{tab === 'mytab' && <MyTab ... />}`.
3. If it needs per-entry API data, wrap it:
   `<DetailsTab selected={selected} render={(details) => <MyTab details={details} />} />`.
4. Style it in `_dex-screen.scss` as `&__my-*` elements.
5. **Check the tab bar fits.** `.dex-screen__tabs` is
   `repeat(5, 1fr)` from 600px and 3 columns below that. A sixth tab needs that
   changed, and the tab bar's height eats into the fixed-height LCD. Before adding
   one, consider whether the content fits an existing tab (abilities went into
   INFO for this reason).

## Add per-entry data (e.g. egg groups)

1. Add the field to `PokemonDetails` in `lib/types.ts`, with a doc comment.
2. Fetch it in `getPokemonDetails` (`lib/details.ts`). Use `fetchApi`, memoise
   anything shared between Pokémon with `memoised(map, key, load)`, and batch lists
   with `inBatches`.
3. Render it through `DetailsTab`. The client hook and the route pick it up
   automatically.
4. Reload the page: the client keeps each entry's details for the life of the
   tab. If the route still returns the old shape, restart `next dev`.

## Add region-wide data (shown in the list or on STATS)

Only do this if it's small. It ships with every page.

1. Add the field to `Pokemon` in `lib/types.ts`.
2. Read it in `toPokemon()` (`lib/pokeapi.ts`) and add the API field to
   `ApiPokemon`.
3. If it needs **another request per Pokémon**, that's about 1,025 extra requests
   per build. Prefer per-entry data instead.

## Add a sound

1. Add a name to the `Sfx` type and its notes to `SOUNDS` in `lib/sfx.ts`.
2. Call `playSfx('name')` from the handler in `FieldDex` that makes the change.
   Don't call it from deep components: handlers are passed down as props so every
   path to an action sounds the same.
3. Keep it short (under ~150ms) and quiet. These play constantly.

## Add a chart to the dashboard

1. Shape the data in a pure function in `lib/transforms.ts`.
2. Build the component in `components/charts/`. Open it with a `// Lesson:`
   comment, position marks with percentages via `pct()`, and colour them with
   `typeStyle()`.
3. Give it a table view (`ui/DataTable.tsx`) and `aria-label`s on visual-only
   marks.
4. Add a `_my-chart.scss` block and `@use` it in `main.scss`.
5. Wire it into `Dashboard.tsx` with a `useMemo`'d dataset, and respect
   `highlight` / `selectedId` if it shows types or entries.

## Add a region (a new generation)

1. Append it to `GENERATIONS` in `lib/generations.ts` (dex range, numeral,
   region).
2. Raise `LAST_DEX_ID` in `lib/details.ts`, the route's upper bound in
   `app/api/dex/[id]/route.ts`, and the comment on `Pokemon.id` if needed.
3. Add any new type colours to `$types` in `_tokens.scss`.

## Check a layout change

Look at it in a browser at **phone (~400px), tablet (~700px) and wide (≥1100px)**.
The Field Dex changes arrangement at 600px and 1100px.
