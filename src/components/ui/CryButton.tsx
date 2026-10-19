'use client';

import { useEffect, useRef, useState } from 'react';

interface CryButtonProps {
  src: string | null;
  name: string;
}

type Status = 'idle' | 'playing' | 'error';

/**
 * Plays a Pokémon's cry on demand.
 *
 * Nothing is downloaded until the button is pressed: the Audio object is
 * created in the click handler, not on render. That keeps the page light -
 * a whole region of cries is never fetched just because the list exists.
 * Browsers also only allow sound after a user gesture, so playing on click
 * is the only way it would work anyway.
 */
export function CryButton({ src, name }: CryButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<Status>(src ? 'idle' : 'error');

  // Stop the sound if this Pokémon is swapped out mid-cry.
  useEffect(() => () => audioRef.current?.pause(), []);

  const play = () => {
    if (!src) return;
    audioRef.current?.pause();
    const audio = new Audio(src);
    audio.volume = 0.6;
    audio.onended = () => setStatus('idle');
    audioRef.current = audio;
    setStatus('playing');
    // play() rejects if the format isn't supported (e.g. .ogg on older Safari).
    audio.play().catch(() => setStatus('error'));
  };

  const label = status === 'error' ? 'No cry' : status === 'playing' ? 'Playing' : 'Cry';

  return (
    <button
      type="button"
      className={`cry-button cry-button--${status}`}
      onClick={play}
      disabled={status === 'error'}
      aria-label={status === 'error' ? `No cry available for ${name}` : `Play ${name}'s cry`}
    >
      <svg className="cry-button__icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path className="cry-button__speaker" d="M2 6 H5 L9 2.5 V13.5 L5 10 H2 Z" />
        <path className="cry-button__wave cry-button__wave--near" d="M11 5.5 Q12.5 8 11 10.5" />
        <path className="cry-button__wave cry-button__wave--far" d="M13 3.5 Q15.5 8 13 12.5" />
      </svg>
      <span className="cry-button__label">{label}</span>
    </button>
  );
}
