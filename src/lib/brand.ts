// Brand values for places Sass can't reach: generated images (Open Graph,
// app icons) and the web manifest. Keep in sync with styles/abstracts/_tokens.scss.

export const SITE_NAME = 'Dex Data Visuals';
export const SITE_DESCRIPTION =
  'Five retro-handheld readouts on every generation of Pokémon - type shares, attack vs defense, stat totals and more, built from the PokeAPI.';

/** Absolute site URL, used to make preview-image links absolute. */
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000'),
);

export const COLORS = {
  ink: '#1b1b2f',
  paper: '#ffffff',
  page: '#e9e6df',
  pageDot: '#d3cfc4',
  dexRed: '#c4302a',
  casingShade: '#9e241f',
  casingShine: '#de5248',
  yellow: '#f7c948',
  lens: '#8fd3ff',
  lensShade: '#4fa3da',
  lensShine: '#e8f7ff',
  lightGreen: '#5bd06e',
  lightRed: '#ff8a80',
  screen: '#f3f6ee',
  lcd: '#dcefd3',
  bezel: '#23253a',
  track: '#e2ded3',
  textSoft: '#3d4050',
  labelRed: '#9b231a',
} as const;

export const TYPE_COLORS: Record<string, string> = {
  normal: '#c9c2a5',
  fire: '#f59f5f',
  water: '#7fb0f2',
  electric: '#f4d44e',
  grass: '#82cc6e',
  ice: '#a3e0e3',
  fighting: '#e07468',
  poison: '#be86cf',
  ground: '#e0c47a',
  flying: '#b4c2f5',
  psychic: '#f48aa9',
  bug: '#b5c94a',
  rock: '#c7ae63',
  ghost: '#9a8dcb',
  dragon: '#9a8ef2',
  dark: '#8e7c6e',
  steel: '#bcc5ce',
  fairy: '#f2b1dd',
};
