import type { CSSProperties } from 'react';

// The bridge between data and Sass. Components never hard-code colors or
// positions in CSS rules; instead they set a few custom properties inline,
// and the BEM stylesheets read them:
//
//   <span class="type-dot" style="--type-color: var(--type-fire)">
//   .type-dot { background: var(--type-color); }

/** The CSS variable holding a type's color (defined in _tokens.scss). */
export function typeColor(type: string): string {
  return `var(--type-${type})`;
}

/** Inline style that hands an element its type color. */
export function typeStyle(type: string, extra?: CSSProperties): CSSProperties {
  return { '--type-color': typeColor(type), ...extra } as CSSProperties;
}

/** Format a 0..1 fraction as a CSS percentage, e.g. for left / height. */
export function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}
