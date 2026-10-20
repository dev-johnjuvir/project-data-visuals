'use client';

import { useEffect, useState } from 'react';
import type { PokemonDetails } from '@/lib/types';

export type DetailsState =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; details: PokemonDetails };

// Shared across tabs and remounts: flipping INFO -> SKILLS, or browsing
// back to an entry, reuses the first request instead of making another.
const cache = new Map<number, Promise<PokemonDetails>>();

function load(id: number): Promise<PokemonDetails> {
  const cached = cache.get(id);
  if (cached) return cached;
  const request = fetch(`/api/dex/${id}`).then((res) => {
    if (!res.ok) throw new Error(`Details for #${id} returned ${res.status}`);
    return res.json() as Promise<PokemonDetails>;
  });
  cache.set(id, request);
  request.catch(() => cache.delete(id)); // a failure can be retried
  return request;
}

/** Abilities and moves for one entry, fetched on demand. */
export function usePokemonDetails(id: number): DetailsState {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ id: number; details?: PokemonDetails; failed?: boolean } | null>(null);

  useEffect(() => {
    let current = true; // ignore a slow response for an entry we've left
    load(id).then(
      (details) => current && setResult({ id, details }),
      () => current && setResult({ id, failed: true }),
    );
    return () => {
      current = false;
    };
  }, [id, attempt]);

  if (result?.id !== id || (!result.details && !result.failed)) return { status: 'loading' };
  if (result.failed) {
    return {
      status: 'error',
      retry: () => {
        setResult(null);
        setAttempt((n) => n + 1);
      },
    };
  }
  return { status: 'ready', details: result.details! };
}
