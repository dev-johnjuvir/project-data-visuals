import { getPokemonDetails } from '@/lib/details';

// One entry's abilities and moves for the Field Dex's INFO and SKILLS
// tabs. Built on first request, then cached for a day like the pages - an
// empty generateStaticParams opts the route into that (ISR) caching without
// prerendering all 1,025 entries at build time.
export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}

export async function GET(_request: Request, ctx: RouteContext<'/api/dex/[id]'>) {
  const id = Number((await ctx.params).id);
  // Dex numbers, plus the 10001+ range PokeAPI uses for alternate forms.
  const valid = Number.isInteger(id) && ((id >= 1 && id <= 1025) || (id > 10000 && id < 11000));
  if (!valid) {
    return Response.json({ error: 'Unknown Pokédex number' }, { status: 404 });
  }
  // A PokeAPI failure throws (a 500) rather than returning an error body:
  // thrown errors are never cached, so the next request simply tries again.
  return Response.json(await getPokemonDetails(id));
}
