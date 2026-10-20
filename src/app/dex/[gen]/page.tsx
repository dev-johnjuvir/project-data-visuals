import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DevSuspense } from '@/components/DevSuspense';
import { LoadingPanel } from '@/components/LoadingPanel';
import { FieldDex } from '@/components/dex/FieldDex';
import { GENERATIONS, generationSize, getGeneration, type Generation } from '@/lib/generations';
import { pageMetadata } from '@/lib/metadata';
import { getPokemonWithForms } from '@/lib/pokeapi';

// Same data and caching as the charts pages: getPokemon() memoises per
// region, so building /dex/1 after /generation/1 costs no extra requests.
// The dex also lists alternate forms (megas etc.), loaded once for all regions.
export const revalidate = 86400;

export const dynamicParams = false;
export function generateStaticParams() {
  return GENERATIONS.map((g) => ({ gen: String(g.id) }));
}

interface PageProps {
  params: Promise<{ gen: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const generation = getGeneration(Number((await params).gen));
  if (!generation) return {};
  return pageMetadata({
    title: `Field Dex · Region ${generation.numeral}`,
    description: `A retro handheld Pokédex for the ${generationSize(generation)} Pokémon of ${generation.region}: search by name or number, filter by type, and scan each entry's stats, info, rankings and cry.`,
    path: `/dex/${generation.id}`,
  });
}

export default async function DexPage({ params }: PageProps) {
  const generation = getGeneration(Number((await params).gen));
  if (!generation) notFound();

  return (
    <main className="dex-page">
      <DevSuspense fallback={<LoadingPanel count={generationSize(generation)} region={generation.region} />}>
        <RegionDex generation={generation} />
      </DevSuspense>
      <p className="dex-page__note">
        Data from <a href="https://pokeapi.co">pokeapi.co</a>. Unofficial fan-made device design, not affiliated with
        any game publisher.
      </p>
    </main>
  );
}

async function RegionDex({ generation }: { generation: Generation }) {
  const pokemon = await getPokemonWithForms(generation);
  // key resets the device (selection, tab, search) when the region changes
  return <FieldDex key={generation.id} generation={generation} pokemon={pokemon} />;
}
