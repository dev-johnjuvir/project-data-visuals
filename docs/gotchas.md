# Gotchas

[← Wiki home](README.md)

Problems this codebase has already hit, so you don't hit them twice.

## PokeAPI data

### Version-group ids aren't release order
`blue-japan` (a 1996 game) has id 29; `scarlet-violet` has id 25. Picking the
"newest" game by highest id gave Pikachu a 7-move Japanese Blue learnset. Use the
version group's **`order`** field (`getGameOrder` in `lib/details.ts`).

### Forms have ids above 10000 and no species record
Mega Charizard X is `/pokemon/10034`. `/pokemon-species/10034` doesn't exist, so go
through `raw.species.url`. Show `species` (the dex number), never `id`, and count
"species with this ability" without the 10000+ ids.

### Megas have almost no learnsets
PokeAPI only lists Mega moves for the Let's Go games. Megas use the base form's
learnset.

### Evolution details are per game
Each evolution step has several `evolution_details` entries (Leafeon: Moss Rock in
older games, Leaf Stone in newer ones). Prefer the one with `is_default`, otherwise
take the last.

### Pokédex text needs cleaning
Gen I–III entries contain hard line breaks, form feeds (`\f`) and "POKéMON". Gen II
splits words across lines with a soft hyphen (`U+00AD`, as in "anger-ed"), which must be
joined with **no** space. Entries are tagged by single game (`red`), not by
generation; the generation comes from `/version/{name}` → its version group.

### Some sprites don't exist yet
Brand-new forms (Mega Zygarde) can have `sprite: null`. Render a same-size empty
box so the card keeps its shape.

## Next.js 16

### Don't cache errors under ISR
A route with `revalidate` that *returns* a 502 can cache that 502 for the whole
revalidate window. *Throw* instead: thrown errors aren't cached, and Next keeps
serving the last good response.

### `next dev` writes an `AGENTS.md`
Next 16 generates `AGENTS.md` in the repo root on startup. Don't commit it, or set
`agentRules: false` in `next.config.ts`.

### One dev server per project
A second `next dev` in the same folder refuses to start ("Another next dev server
is already running") and exits, even on a different port. Use the one that's
already running.

### Strict Mode runs effects twice in dev
An effect that reads the URL while another effect rewrites it will read the
*rewritten* URL on its second run. The Field Dex deep link opened on the default
entry until the query was captured once in a ref. Production runs effects once,
so this only shows in `next dev`, which is exactly why it's easy to miss.

### Suspense in production
`DevSuspense` exists for a reason: a real `<Suspense>` boundary on a pre-built page
ships the spinner in the static HTML. See [Architecture](architecture.md#loading-states).

## CSS

### A long list stretches the screen
In the landscape grid, giving the list box `flex: 1; height: 0` was **not** enough.
When the browser sizes the grid row it measures a column flexbox's content, and the
150+ entries made the row (and the screen's bezel) far taller than the LCD. Fix:
`contain: size` on the list's grid item, so the screen alone sets the row height.

### Narrow screen, long STATS tab
At 1× width the STATS radar and bars wrap onto separate rows, and only two bars fit
in the LCD. The screen column is 1.4× on purpose.

### Pixelify's 5 and 8 look alike
At UI sizes Pixelify Sans draws 5 like an S, so "#005" and "#008" blur together.
Digits come from a separate digits-only font (see [Styling](styling.md#tokens)).
If you change fonts, check that numbers stay readable. With `next/font/local` +
`unicode-range`, keep `adjustFontFallback: false`: the generated metric fallback
has no `unicode-range`, so it would take over the letters too.

### Sass escapes in generated code
`content: '\25B6'` written from a Python string came out as a raw control
character, and the page showed "B6". Write the character itself
(`content: '▶';`), or check the bytes after scripted edits.

### Lazy images inside a scroll container
With `loading="lazy"`, evolution sprites inside the LCD's scrolling body hadn't
loaded when the tab was checked in headless Chrome. There are only a handful per
entry, so they load eagerly.

### Centred flex rows with a tall branch
Centring evolution stages vertically pushed Eevee halfway down its eight-card
branch, below the visible area. Stages are top-aligned, with arrows pinned at card
height.

## Sound

### Autoplay rules
An `AudioContext` created before a user gesture starts suspended. `playSfx` is only
ever called from gestures and resumes the context, so don't call it on mount or in
an effect.

### `scroll` events also fire on programmatic scrolling
Listening to `onScroll` played a tick every time the list followed the selection.
Use `wheel` and `touchmove` (`scrollSfxProps`).
