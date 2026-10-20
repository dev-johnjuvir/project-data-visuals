# Sound

[← Wiki home](README.md)

The Field Dex makes Game Boy-style UI blips. Everything is in `lib/sfx.ts`. There
are no audio files: tones are synthesised with the Web Audio API.

> They're original tones in the style of the Game Boy's square-wave channels,
> **not** samples from any game. Keep it that way: don't add ripped game audio.
> (Each Pokémon's cry is separate. It comes from PokeAPI and plays through
> `CryButton`.)

## The three sounds

| Sound | Notes | Plays on |
|---|---|---|
| `scroll` | E6, 18ms | D-pad ↑↓, arrow keys, wheel or touch scrolling in the list and the screen body |
| `button` | A5, 45ms | Tabs, A, D-pad ←→, first/last jumps, Swap, type filter |
| `select` | C6 → G6, 55 + 85ms | Choosing an entry (list, B, Rank neighbours, evolution and form cards), picking a rival, turning sound back on |

## How it works

```ts
playSfx('select');
```

- One shared `AudioContext`, created or resumed on the first call. Browsers only
  allow audio after a user gesture, and every call comes from one.
- Each note is a `square` oscillator through a gain with an instant attack and a
  fast exponential fade. Notes in a sound play back to back.
- `scroll` is throttled to one every 60ms, so key-repeat and fast wheels don't
  machine-gun.
- **List auto-scroll stays silent.** `scrollSfxProps()` listens to `wheel` and
  `touchmove` (one tick per ~40px of finger travel), never to `scroll`. A `scroll`
  listener would also fire when the list follows the selection, doubling the
  sound. Spread it onto a scroll container:
  `const scrollSfx = useMemo(scrollSfxProps, []);` then `<div {...scrollSfx}>`.

## Mute

- `useMuted()` reads the shared state (via `useSyncExternalStore`) and
  `setMuted(bool)` changes it. The speaker button in the Field Dex top bar uses
  both.
- It's saved in `localStorage` under `field-dex-muted`. If storage is blocked,
  sound starts on and the choice lasts only for the visit.
- The server render assumes sound on. The client corrects that after hydration.

## Tuning

At the top of `lib/sfx.ts`:

- `SOUNDS`: `[frequency Hz, duration ms]` per note. Higher frequency means a higher
  pitch. Doubling a frequency raises it one octave.
- `VOLUME` (0.05): square waves are harsh, so keep it low. 0.08 is already loud.
- `SCROLL_GAP_MS` (60): the minimum gap between ticks.

To add a sound, see [Recipes](recipes.md#add-a-sound).
