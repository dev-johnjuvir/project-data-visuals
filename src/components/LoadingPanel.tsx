import { Spinner } from './ui/Spinner';

/** Fills the dashboard's space while the server is still fetching from the PokeAPI. */
export function LoadingPanel({ count, region }: { count: number; region: string }) {
  return (
    <div className="loading-panel">
      <Spinner label="Loading Pokémon data" />
      <p className="loading-panel__title">Catching {count} Pokémon from {region}…</p>
      <p className="loading-panel__detail">
        The first visit to a generation fetches every Pokémon from the PokeAPI. After that it&rsquo;s cached.
      </p>
    </div>
  );
}
