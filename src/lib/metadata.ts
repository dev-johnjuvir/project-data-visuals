import type { Metadata } from 'next';
import { SITE_NAME } from './brand';

/**
 * Complete metadata for one page.
 *
 * Why a helper: when a page sets `openGraph` or `twitter`, Next.js REPLACES
 * the layout's object instead of merging into it - a page that only sets a
 * title would silently drop the layout's `card: 'summary_large_image'`,
 * `siteName` and `locale`. Building the whole object here keeps every page
 * complete. (The image itself comes from the route's opengraph-image file.)
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: 'website', siteName: SITE_NAME, locale: 'en_US', title, description, url: path },
    twitter: { card: 'summary_large_image', title, description },
  };
}
