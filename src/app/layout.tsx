import type { Metadata } from 'next';
import { M_PLUS_Rounded_1c, Pixelify_Sans, Press_Start_2P } from 'next/font/google';
import '@/styles/main.scss';

// next/font downloads these at build time and serves them from our own
// domain: no request to Google from the visitor's browser, and no layout
// shift while fonts load. Each one is exposed as a CSS variable for Sass.
const pixel = Pixelify_Sans({ subsets: ['latin'], variable: '--font-pixel', display: 'swap' });
const label = Press_Start_2P({ subsets: ['latin'], weight: '400', variable: '--font-label', display: 'swap' });
const body = M_PLUS_Rounded_1c({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dex Data Visuals',
  description: 'Five readouts on every generation of Pokémon, from the PokeAPI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning: browser extensions (Grammarly, password
    // managers, translators, dark-mode tools) add attributes to <html> and
    // <body> before React hydrates, which React reports as a mismatch. This
    // only silences attribute differences on these two elements - it does
    // not reach into the components below, so real bugs still surface.
    <html lang="en" className={`${pixel.variable} ${label.variable} ${body.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
