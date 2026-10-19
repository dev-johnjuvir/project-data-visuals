import { ImageResponse } from 'next/og';
import { COLORS } from '@/lib/brand';

// iOS ignores SVG favicons for "Add to Home Screen", so this draws the same
// lens icon as app/icon.svg as a 180x180 PNG. iOS rounds the corners itself,
// so the casing fills the whole square here.
//
// The lens is built from stacked circles (ink ring > shade > lens > shine),
// mirroring the SVG, rather than border + inset shadows, which the image
// renderer draws differently from a browser.

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

const circle = (diameter: number, color: string, extra: object = {}) => ({
  display: 'flex',
  width: diameter,
  height: diameter,
  borderRadius: 999,
  background: color,
  ...extra,
});

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          background: COLORS.dexRed,
        }}
      >
        {/* Ink ring around the lens */}
        <div style={circle(124, COLORS.ink, { alignItems: 'center', justifyContent: 'center', marginRight: 16, marginTop: 8 })}>
          {/* Shaded glass */}
          <div style={circle(100, COLORS.lensShade, { position: 'relative' })}>
            {/* Lit glass, offset toward the top-left */}
            <div style={circle(64, COLORS.lens, { position: 'absolute', top: 10, left: 10 })} />
            {/* Highlight */}
            <div style={circle(22, COLORS.lensShine, { position: 'absolute', top: 22, left: 22 })} />
          </div>
        </div>
        {/* Yellow status light */}
        <div style={circle(40, COLORS.ink, { position: 'absolute', top: 20, right: 20, alignItems: 'center', justifyContent: 'center' })}>
          <div style={circle(26, COLORS.yellow)} />
        </div>
      </div>
    ),
    size,
  );
}
