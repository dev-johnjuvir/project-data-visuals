import { notFound } from 'next/navigation';
import { GENERATIONS, getGeneration } from '@/lib/generations';
import { OG_SIZE } from '@/lib/og';
import { dexCard } from '@/lib/og-cards';

export const alt = 'The Field Dex: a retro handheld Pokédex showing the region’s three starters';
export const size = OG_SIZE;
export const contentType = 'image/png';

export function generateStaticParams() {
  return GENERATIONS.map((g) => ({ gen: String(g.id) }));
}

export default async function Image({ params }: { params: Promise<{ gen: string }> }) {
  const generation = getGeneration(Number((await params).gen));
  if (!generation) notFound();
  return dexCard(generation);
}
