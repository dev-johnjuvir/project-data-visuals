import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Dashboard } from '@/components/Dashboard';
import { LoadingPanel } from '@/components/LoadingPanel';
import { RegionPicker } from '@/components/RegionPicker';
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
  return { title: generation ? `Region ${generation.numeral} · Dex Data Visuals` : 'Dex Data Visuals' };
}

export default async function GenerationPage({ params }: PageProps) {
  const generation = getGeneration(Number((await params).gen));
  if (!generation) notFound();

  // The header needs no API data, so it renders immediately. Only the
  // dashboard waits on the PokeAPI, so only it sits behind <Suspense>.
  return (
    <div className="page">
      <header className="dex-header">
        <div className="dex-header__inner">
          <div className="dex-header__top">
            {/* The handheld's lens and status lights - pure decoration */}
            <div className="dex-header__lights" aria-hidden="true">
              <span className="dex-header__lens" />
              <span className="dex-header__light dex-header__light--yellow" />
              <span className="dex-header__light dex-header__light--green" />
              <span className="dex-header__light dex-header__light--red" />
            </div>
            <p className="dex-header__breadcrumb">
              PokeAPI · Generation {generation.numeral} · {generation.region}
            </p>
          </div>
          <div className="dex-header__main">
            <div className="dex-header__intro">
              <h1 className="dex-header__title">Dex Data Visuals</h1>
              <p className="dex-header__lede">
                Five readouts on the {generationSize(generation)} creatures of Region {generation.numeral}. Pick a
                region, light up a type, then tap any entry to scan it.
              </p>
            </div>
            <RegionPicker current={generation} />
          </div>
        </div>
      </header>

      <main className="page__main">
        {STREAM_DASHBOARD ? (
          <Suspense fallback={<LoadingPanel count={generationSize(generation)} region={generation.region} />}>
            <GenerationDashboard generation={generation} />
          </Suspense>
        ) : (
          <GenerationDashboard generation={generation} />
        )}
        <footer className="page__footer">
          <span>
            Data from <a href="https://pokeapi.co">pokeapi.co</a>
          </span>
          <span>Unofficial fan-made data project. Not affiliated with any game publisher.</span>
        </footer>
      </main>
    </div>
  );
}

async function GenerationDashboard({ generation }: { generation: Generation }) {
  const pokemon = await getPokemon(generation);
  // key resets filters and selection when the generation changes
  return <Dashboard key={generation.id} generation={generation} pokemon={pokemon} />;
}
