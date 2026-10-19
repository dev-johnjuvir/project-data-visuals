import type { MetadataRoute } from 'next';
import { COLORS, SITE_DESCRIPTION, SITE_NAME } from '@/lib/brand';

// The web app manifest: the name, colors and icons a phone uses when the
// site is added to the home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: 'Dex Visuals',
    description: SITE_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: COLORS.page,
    theme_color: COLORS.dexRed,
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
