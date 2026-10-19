import { Suspense, type ReactNode } from 'react';

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * A <Suspense> boundary that only exists in development.
 *
 * `next dev` fetches the PokeAPI on request, so a cold region takes a few
 * seconds and a loading panel helps. In production every page is pre-built,
 * so no visitor ever waits on the server - and a <Suspense> boundary would
 * make the static HTML ship the fallback first, with the real content hidden
 * until an inline script swaps it in. Without JavaScript (or for a crawler)
 * the page would be a spinner forever. Skipping it keeps the HTML complete.
 */
export function DevSuspense({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return IS_DEV ? <Suspense fallback={fallback}>{children}</Suspense> : <>{children}</>;
}
