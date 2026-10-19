'use client';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="page__main">
      <div className="page__error">
        <p className="page__error-title">Scan failed</p>
        <p>Couldn’t reach the PokeAPI: {error.message}</p>
        <button type="button" className="page__retry" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
