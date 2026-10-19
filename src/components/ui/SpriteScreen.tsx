'use client';

import { useEffect, useRef, useState } from 'react';
import { Spinner } from './Spinner';

interface SpriteScreenProps {
  src: string | null;
  name: string;
  size?: 'regular' | 'compact';
}

type Status = 'loading' | 'loaded' | 'error';

/**
 * The Pokédex "display window": the entry's sprite on a little LCD screen.
 *
 * A plain <img>, not next/image: these are tiny pixel-art GIFs, and Next's
 * optimizer would turn them into a still frame. Render it with
 * `image-rendering: pixelated` so scaling keeps hard pixel edges.
 *
 * Give this component a `key` of the image URL, so switching Pokémon remounts
 * it and the status starts over at "loading".
 */
export function SpriteScreen({ src, name, size = 'regular' }: SpriteScreenProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [status, setStatus] = useState<Status>(src ? 'loading' : 'error');

  // SSR gotcha: the server sends the <img> in the HTML, so the browser can
  // finish downloading it *before* React hydrates and attaches onLoad - the
  // event fires with nobody listening and we'd spin forever. So after mount,
  // check whether the image already finished.
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete) setStatus(img.naturalWidth > 0 ? 'loaded' : 'error');
  }, []);

  return (
    <div className={`sprite-screen sprite-screen--${status}${size === 'compact' ? ' sprite-screen--compact' : ''}`}>
      {src && status !== 'error' && (
        // eslint-disable-next-line @next/next/no-img-element -- animated GIF, see above
        <img
          ref={imgRef}
          className="sprite-screen__image"
          src={src}
          alt={name}
          width={96}
          height={96}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      )}
      {status === 'loading' && (
        <span className="sprite-screen__overlay">
          <Spinner size="small" label={`Loading ${name}`} />
        </span>
      )}
      {status === 'error' && (
        <span className="sprite-screen__overlay sprite-screen__overlay--empty" role="img" aria-label={`No image of ${name}`}>
          ?
        </span>
      )}
    </div>
  );
}
