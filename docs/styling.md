# Styling

[← Wiki home](README.md)

Sass compiled by Next, BEM class names, and design tokens emitted as CSS custom
properties. No CSS-in-JS and no utility classes.

## Files

```
src/styles/
  abstracts/_tokens.scss    $colors, $types, $space, breakpoints → :root custom properties
  abstracts/_mixins.scss    space(), from(), pixel(), label(), hard-card, screen,
                            pressable/pressed, focus-ring, button-reset,
                            hide-scrollbar, visually-hidden
  base/_base.scss           page background, fonts
  components/_<block>.scss  exactly one BEM block per file
  main.scss                 @use's everything, in order (tokens → base → blocks)
```

**New block?** Create `components/_my-block.scss`, start it with
`@use '../abstracts/tokens' as *;` and `@use '../abstracts/mixins' as *;`, and add
`@use 'components/my-block';` to `main.scss` in the right group.

## BEM

`block__element--modifier`, for example `dex-screen__vs-fill--lost` or
`dex-entry--dimmed`. In Sass, nest with `&__element` and `&--modifier`. A modifier
that depends on a different element uses `@at-root` or a compound selector (see
`.dex-screen__evo`, where only `button.dex-screen__evo` gets hover styles).

## Tokens

- Colours: `var(--ink)`, `var(--lcd)`, `var(--paper)`, ... Never hard-code a
  palette colour in a rule.
- Type colours: `var(--type-fire)` etc., all 18 of them, pastel so they sit on the
  LCD. Every mark that wears one also gets a 2–3px ink outline, so the outline
  carries the contrast.
- Spacing: `space(1)`…`space(8)` = 4, 8, 12, 16, 20, 24, 28, 48px.
- Breakpoints: `@include from($breakpoint-dex-mid)` (600px), `$breakpoint-md`
  (900px), `$breakpoint-dex-wide` (1100px).
- Fonts (variables from `next/font` in `layout.tsx`): `$font-pixel` (Pixelify
  Sans, headings and numbers), `$font-label` (Press Start 2P, tiny caps labels),
  `$font-body` (M PLUS Rounded 1c). Use the `pixel($size, $weight)` and
  `label($size)` mixins.

## The data-to-CSS bridge (`lib/style.ts`)

Components never write colours or positions in CSS rules. They set a custom
property inline and the stylesheet reads it:

```tsx
<span className="type-dot" style={typeStyle('fire')} />   // --type-color: var(--type-fire)
<div className="bar__fill" style={{ width: pct(value / 255) }} />
```
```scss
.type-dot { background: var(--type-color); }
```

- `typeStyle(type, extra?)` sets `--type-color`.
- `pct(fraction)` formats `0..1` as a CSS percentage.
- For a second colour (the VS rival), set another property, like
  `--rival-color`, the same way.

## House look

- `hard-card`: thick ink outline + hard, unblurred offset shadow.
- `screen`: the pale-green LCD inset.
- `pressable` / `pressed`: buttons that sink into the page when active.
- **Field Dex:** a dark bezel (`--bezel`) around a green LCD (`--lcd`) with faint
  scanlines. Cards inside it use `--lcd-card` and a 2px ink border. The current
  item is filled `--yellow`.
- Focus rings are blue on paper pages. The Field Dex overrides `--focus` to
  yellow so rings show on red and dark backgrounds.
- Touch targets are at least 44px.
