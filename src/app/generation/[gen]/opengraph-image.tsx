import { notFound } from 'next/navigation';
import { GENERATIONS, getGeneration } from '@/lib/generations';
import { OG_SIZE } from '@/lib/og';
import { chartsCard } from '@/lib/og-cards';

// A file named opengraph-image next to a page becomes that page's link
// preview: Next.js serves the PNG and adds the og:image meta tags for us.

export const alt = 'Dex Data Visuals: the region’s top types and strongest Pokémon';
export const size = OG_SIZE;
export const contentType = 'image/png';

// Render all nine at build time, like the pages themselves.
export function generateStaticParams() {
  return GENERATIONS.map((g) => ({ gen: String(g.id) }));
}

export default async function Image({ params }: { params: Promise<{ gen: string }> }) {
  const generation = getGeneration(Number((await params).gen));
  if (!generation) notFound();
  return chartsCard(generation);
}
