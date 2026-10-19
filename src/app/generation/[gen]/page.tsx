import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Dashboard } from '@/components/Dashboard';
import { LoadingPanel } from '@/components/LoadingPanel';
import { GENERATIONS, generationSize, getGeneration, type Generation } from '@/lib/generations';
import { getPokemon } from '@/lib/pokeapi';

// Server Component: data is fetched on the server, and only the slimmed
// records are sent to the browser. Regenerated at most once a day.
export const revalidate = 86400;

// Pre-build one static page per generation; any other value is a 404.
export const dynamicParams = false;
export function generateStaticParams() {
  return GENERATIONS.map((g) => ({ gen: String(g.id) }));
}

/**
 * Stream the dashboard behind a spinner only in development.
 *
 * `next dev` fetches the PokeAPI on request, so a cold generation takes a few
 * seconds and a spinner helps. In production every page is pre-built, so no
 * visitor ever waits on the server - and a <Suspense> boundary would make the
 * static HTML ship the spinner first, with the real charts hidden until an
 * inline script swaps them in. Without JavaScript (or for a crawler) the
 * page would be a spinner forever. Skipping it keeps the HTML complete.
 */
const STREAM_DASHBOARD = process.env.NODE_ENV === 'development';

interface PageProps {
  params: Promise<{ gen: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const generation = getGeneration(Number((await params).gen));
  return { title: generation ? `Generation ${generation.numeral} · Pokédex Data Visuals` : 'Pokédex Data Visuals' };
}

export default async function GenerationPage({ params }: PageProps) {
  const generation = getGeneration(Number((await params).gen));
  if (!generation) notFound();

  // The header needs no API data, so it renders immediately. Only the
  // dashboard waits on the PokeAPI, so only it sits behind <Suspense>.
  return (
    <main className="page">
      <header className="page__header">
        <p className="page__eyebrow">
          PokeAPI · Generation {generation.numeral} · {generation.region}
        </p>
        <h1 className="page__title">Pokédex Data Visuals</h1>
        <p className="page__intro">
          Five ways to look at the same {generationSize(generation)} Pokémon. Each chart was picked for the question it
          answers. Pick a generation, highlight a type, hover for details, or switch any card to its table view.
        </p>
      </header>
      {STREAM_DASHBOARD ? (
        <Suspense fallback={<LoadingPanel count={generationSize(generation)} region={generation.region} />}>
          <GenerationDashboard generation={generation} />
        </Suspense>
      ) : (
        <GenerationDashboard generation={generation} />
      )}
      <footer className="page__footer">
        Data from <a href="https://pokeapi.co">pokeapi.co</a>
      </footer>
    </main>
  );
}

async function GenerationDashboard({ generation }: { generation: Generation }) {
  const pokemon = await getPokemon(generation);
  // key resets filters and selection when the generation changes
  return <Dashboard key={generation.id} generation={generation} pokemon={pokemon} />;
}
