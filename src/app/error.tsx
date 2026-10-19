'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page">
      <p className="page__status">Couldn’t reach the PokeAPI: {error.message}</p>
      <button type="button" className="filter-bar__reset" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
