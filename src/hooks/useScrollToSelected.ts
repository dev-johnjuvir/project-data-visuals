'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Keep the selected row visible inside a scrolling list - scrolling only the
 * list, never the page (which `element.scrollIntoView()` would also do).
 * Rows are found by a `data-id` attribute; the container needs
 * `position: relative` so each row's offsetTop is measured from it.
 */
export function useScrollToSelected(containerRef: RefObject<HTMLElement | null>, selectedId: number) {
  useEffect(() => {
    const box = containerRef.current;
    const row = box?.querySelector<HTMLElement>(`[data-id="${selectedId}"]`);
    if (!box || !row) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < box.scrollTop) box.scrollTop = top - 8;
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight + 8;
  }, [containerRef, selectedId]);
}
