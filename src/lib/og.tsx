// Shared pieces for the generated social preview images (Open Graph).
//
// These are drawn with next/og's ImageResponse, which turns a small subset of
// JSX + inline styles into a PNG at build time. Its rules differ from the
// browser: every element with more than one child needs `display: flex`, no
// CSS classes or Sass, and fonts must be passed in as raw font files.

import type { ReactNode } from 'react';
import { COLORS } from './brand';

export const OG_SIZE = { width: 1200, height: 630 };

type FontWeight = 400 | 700;
type OgFont = { name: string; data: ArrayBuffer; weight: FontWeight; style: 'normal' };

/**
 * Download one Google Font as TTF, subset to just the characters we draw.
 * Asking the CSS API without a browser user agent makes it return TTF (the
 * image renderer can't read WOFF2). Returns null on failure so a network
 * blip falls back to the default font instead of failing the build.
 */
async function loadGoogleFont(family: string, weight: FontWeight, text: string): Promise<ArrayBuffer | null> {
  try {
    const query = `family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(`https://fonts.googleapis.com/css2?${query}`)).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

/** The two display fonts, subset to the given text. */
export async function ogFonts(text: string): Promise<OgFont[]> {
  const [pixel, label] = await Promise.all([
    loadGoogleFont('Pixelify+Sans', 700, text),
    loadGoogleFont('Press+Start+2P', 400, text),
  ]);
  const fonts: OgFont[] = [];
  if (pixel) fonts.push({ name: 'Pixelify', data: pixel, weight: 700, style: 'normal' });
  if (label) fonts.push({ name: 'PressStart', data: label, weight: 400, style: 'normal' });
  return fonts;
}

/** Fetch an image and inline it as a data URI; null if it can't be fetched. */
export async function loadImageDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? 'image/png';
    return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
  } catch {
    return null;
  }
}

export const PIXEL = 'Pixelify, monospace';
export const LABEL = 'PressStart, monospace';

/** The Pokédex lens + status lights, as in the site header. */
export function OgLights({ scale = 1 }: { scale?: number }) {
  const dot = (color: string) => (
    <div
      style={{
        width: 22 * scale,
        height: 22 * scale,
        borderRadius: 999,
        background: color,
        border: `${4 * scale}px solid ${COLORS.ink}`,
      }}
    />
  );
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 * scale }}>
      <div
        style={{
          width: 56 * scale,
          height: 56 * scale,
          borderRadius: 999,
          background: COLORS.lens,
          border: `${6 * scale}px solid ${COLORS.ink}`,
          boxShadow: `inset -${9 * scale}px -${9 * scale}px 0 ${COLORS.lensShade}, inset ${7 * scale}px ${7 * scale}px 0 ${COLORS.lensShine}`,
        }}
      />
      {dot(COLORS.yellow)}
      {dot(COLORS.lightGreen)}
      {dot(COLORS.lightRed)}
    </div>
  );
}

/** Dotted beige page - the site's background. */
export function OgPage({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: COLORS.page,
        backgroundImage: `radial-gradient(${COLORS.pageDot} 2px, transparent 2px)`,
        backgroundSize: '24px 24px',
        color: COLORS.ink,
        fontFamily: PIXEL,
      }}
    >
      {children}
    </div>
  );
}
