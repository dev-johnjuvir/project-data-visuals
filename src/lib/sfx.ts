'use client';

import { useSyncExternalStore, type TouchEvent } from 'react';

// 8-bit UI sounds, synthesised with the Web Audio API - no audio files.
// A square wave is what the Game Boy's pulse channels produced; a few
// short notes with a fast fade give the menu "blip" feel. These are our
// own tones in that style, not samples from any game.

export type Sfx = 'button' | 'select' | 'scroll';

/** [frequency Hz, duration ms] per note, played back to back. */
const SOUNDS: Record<Sfx, [number, number][]> = {
  button: [[880, 45]], // A5: a single press
  select: [
    [1047, 55], // C6 then G6: a rising "confirm"
    [1568, 85],
  ],
  scroll: [[1319, 18]], // E6: a short cursor tick
};

/** Square waves are loud - keep the whole thing quiet. */
const VOLUME = 0.05;
/** Wheel and key-repeat fire fast; don't stack ticks closer than this. */
const SCROLL_GAP_MS = 60;
const STORAGE_KEY = 'field-dex-muted';

let ctx: AudioContext | null = null;
let lastScroll = 0;

// --- Mute, shared by every component and remembered per browser ---------

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false; // storage blocked (private mode, previews): sound on
  }
}

let muted = typeof window === 'undefined' ? false : readMuted();
const listeners = new Set<() => void>();

export function setMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  } catch {
    // not remembered, but still applies for this visit
  }
  listeners.forEach((listener) => listener());
}

export function useMuted(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => muted,
    () => false, // server render: assume sound on, corrected after hydration
  );
}

// --- Playback ------------------------------------------------------------

export function playSfx(name: Sfx) {
  if (muted || typeof window === 'undefined') return;
  if (name === 'scroll') {
    const now = performance.now();
    if (now - lastScroll < SCROLL_GAP_MS) return;
    lastScroll = now;
  }

  // Browsers only allow audio after a user gesture; every call here comes
  // from one, so the context is created (or resumed) on the first press.
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    return; // no Web Audio: stay silent
  }

  let at = ctx.currentTime;
  for (const [frequency, ms] of SOUNDS[name]) {
    const seconds = ms / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = frequency;
    // Instant attack, quick exponential fade: a crisp chip-tune blip.
    gain.gain.setValueAtTime(VOLUME, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + seconds);
    at += seconds;
  }
}

/** Ticks for wheel and touch scrolling. Not onScroll: that also fires when
 *  the list scrolls itself to the selected entry, which would double up. */
export function scrollSfxProps() {
  let lastY: number | null = null;
  return {
    onWheel: () => playSfx('scroll'),
    onTouchStart: (e: TouchEvent) => {
      lastY = e.touches[0]?.clientY ?? null;
    },
    onTouchMove: (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (y === undefined || lastY === null) return;
      // One tick per ~row of finger travel.
      if (Math.abs(y - lastY) >= 40) {
        playSfx('scroll');
        lastY = y;
      }
    },
  };
}
