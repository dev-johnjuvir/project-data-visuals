'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/** Width used on the server, where there is no DOM to measure. */
const SERVER_WIDTH = 560;

/**
 * Measure an element's width so SVG charts can redraw at any screen size.
 *
 * SSR note: the server can't measure anything, so it renders the chart at
 * SERVER_WIDTH and the SVG's viewBox scales that drawing to fit. The first
 * client render uses the same width (so hydration matches), then
 * useLayoutEffect measures the real width *before the browser paints* and
 * redraws at true size - no blank charts, no layout jump.
 */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(SERVER_WIDTH);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.floor(el.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
