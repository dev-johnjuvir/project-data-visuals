import { GENERATIONS } from '@/lib/generations';
import { OG_SIZE } from '@/lib/og';
import { chartsCard } from '@/lib/og-cards';

// The fallback preview for any page without its own (e.g. "/", which
// redirects to Region I): the Region I charts card.

export const alt = 'Dex Data Visuals: Region I’s top types and strongest Pokémon';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function Image() {
  return chartsCard(GENERATIONS[0]);
}
