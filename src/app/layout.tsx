import type { Metadata, Viewport } from 'next';
import { COLORS, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/brand';
import { M_PLUS_Rounded_1c, Pixelify_Sans, Press_Start_2P } from 'next/font/google';
import localFont from 'next/font/local';
import '@/styles/main.scss';

// next/font downloads these at build time and serves them from our own
// domain: no request to Google from the visitor's browser, and no layout
// shift while fonts load. Each one is exposed as a CSS variable for Sass.
const pixel = Pixelify_Sans({ subsets: ['latin'], variable: '--font-pixel', display: 'swap' });
const label = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-label', display: 'swap' });
// Pixelify draws 5 like an S, so "#005" and "#008" read alike. This face
// holds ONLY the digits 0-9 of Jersey 10 (a 3.6 KB subset, OFL - licence
// in src/fonts) and sits first in the pixel stack: unicode-range makes the
// browser use it for digits and fall through to Pixelify for everything
// else. One weight covers 100-900 so bold numbers aren't smeared by faux
// bold, and no metric fallback, which would otherwise grab the letters too.
const digits = localFont({
  src: '../fonts/jersey10-digits.woff2',
  variable: '--font-digits',
  weight: '100 900',
  display: 'swap',
  adjustFontFallback: false,
  declarations: [
    { prop: 'unicode-range', value: 'U+0030-0039' },
    // Jersey's digits run smaller than Pixelify's at the same font-size.
    { prop: 'size-adjust', value: '118%' },
  ],
});
const body = M_PLUS_Rounded_1c({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
});

// Site-wide defaults. Each page adds its own title and description; the
// template turns a page title like "Region IV · Sinnoh" into
// "Region IV · Sinnoh | Dex Data Visuals". Icons, the manifest and preview
// images are picked up from the files in app/ (icon.svg, apple-icon.tsx,
// manifest.ts, opengraph-image.tsx) - no need to list them here.
export const metadata: Metadata = {
  metadataBase: SITE_URL, // makes preview-image URLs absolute, as crawlers require
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['Pokémon', 'Pokédex', 'data visualization', 'PokeAPI', 'charts', 'base stats'],
  openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
};

// Tints the browser's toolbar on mobile to match the red casing.
export const viewport: Viewport = {
  themeColor: COLORS.dexRed,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: browser extensions (Grammarly, password
    // managers, translators, dark-mode tools) add attributes to <html> and
    // <body> before React hydrates, which React reports as a mismatch. This
    // only silences attribute differences on these two elements - it does
    // not reach into the components below, so real bugs still surface.
    <html lang="en" className={`${pixel.variable} ${digits.variable} ${label.variable} ${body.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
