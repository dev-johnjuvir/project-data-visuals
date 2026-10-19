// National Pokédex ranges per generation. They're contiguous, so a
// generation is just "#first..#last" - no extra API round-trip needed.

export interface Generation {
  id: number;
  numeral: string;
  region: string;
  first: number;
  last: number;
}

export const GENERATIONS: Generation[] = [
  { id: 1, numeral: 'I', region: 'Kanto', first: 1, last: 151 },
  { id: 2, numeral: 'II', region: 'Johto', first: 152, last: 251 },
  { id: 3, numeral: 'III', region: 'Hoenn', first: 252, last: 386 },
  { id: 4, numeral: 'IV', region: 'Sinnoh', first: 387, last: 493 },
  { id: 5, numeral: 'V', region: 'Unova', first: 494, last: 649 },
  { id: 6, numeral: 'VI', region: 'Kalos', first: 650, last: 721 },
  { id: 7, numeral: 'VII', region: 'Alola', first: 722, last: 809 },
  { id: 8, numeral: 'VIII', region: 'Galar', first: 810, last: 905 },
  { id: 9, numeral: 'IX', region: 'Paldea', first: 906, last: 1025 },
];

export function getGeneration(id: number): Generation | undefined {
  return GENERATIONS.find((g) => g.id === id);
}

export function generationSize(gen: Generation): number {
  return gen.last - gen.first + 1;
}
