'use client';

import Link from 'next/link';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { filterEntries, typesInUse } from '@/lib/dex';
import type { Generation } from '@/lib/generations';
import { formatDexNumber } from '@/lib/transforms';
import type { Pokemon } from '@/lib/types';
import { DexScreen, TABS, type Tab } from './DexScreen';
import { DexSearchList } from './DexSearchList';

const PIKACHU_ID = 25;

interface FieldDexProps {
  generation: Generation;
  pokemon: Pokemon[];
}

/** The handheld Pokédex: screen, D-pad, A/B buttons and a searchable list. */
export function FieldDex({ generation, pokemon }: FieldDexProps) {
  const [selectedId, setSelectedId] = useState(() =>
    pokemon.some((p) => p.id === PIKACHU_ID) ? PIKACHU_ID : pokemon[0].id,
  );
  // The VS tab's opponent starts as the next entry (Pikachu vs Raichu) and
  // stays put while you browse, so one rival can face the whole region.
  const [rivalId, setRivalId] = useState(() => {
    const at = pokemon.findIndex((p) => p.id === selectedId);
    return pokemon[(at + 1) % pokemon.length].id;
  });
  const [tab, setTab] = useState<Tab>('stats');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const types = useMemo(() => typesInUse(pokemon), [pokemon]);
  const entries = useMemo(() => filterEntries(pokemon, query, typeFilter), [pokemon, query, typeFilter]);

  const index = Math.max(0, pokemon.findIndex((p) => p.id === selectedId));
  const selected = pokemon[index];
  const rival = pokemon.find((p) => p.id === rivalId) ?? selected;
  const first = pokemon[0];
  const last = pokemon[pokemon.length - 1];

  // Browsing wraps around the region; tabs wrap too.
  const browse = (by: number) => setSelectedId(pokemon[(index + by + pokemon.length) % pokemon.length].id);
  const switchTab = (by: number) => setTab(TABS[(TABS.indexOf(tab) + by + TABS.length) % TABS.length]);
  const swap = () => {
    setSelectedId(rival.id);
    setRivalId(selected.id);
  };
  const random = () => {
    // Never "randomly" land on the entry already showing.
    const offset = 1 + Math.floor(Math.random() * (pokemon.length - 1));
    browse(offset);
  };

  // Arrow keys drive the pad while focus is anywhere inside the device -
  // except in the search box and type menu, where arrows already have a job.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('input, select')) return;
    const moves: Record<string, () => void> = {
      ArrowUp: () => browse(-1),
      ArrowDown: () => browse(1),
      ArrowLeft: () => switchTab(-1),
      ArrowRight: () => switchTab(1),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault(); // don't also scroll the page
      move();
    }
  };

  return (
    <div className="field-dex" onKeyDown={onKeyDown}>
      <div className="field-dex__top">
        <div className="field-dex__brand">
          <div className="field-dex__grip" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="field-dex__model">
            <span className="field-dex__model-name">Field Dex R-{generation.id}</span>
            <span className="field-dex__model-region">
              Region {generation.numeral} · {pokemon.length} entries
            </span>
          </div>
        </div>
        <div className="field-dex__status">
          <div className="field-dex__leds" aria-hidden="true">
            <span className="field-dex__led field-dex__led--green" />
            <span className="field-dex__led field-dex__led--yellow" />
            <span className="field-dex__led field-dex__led--white" />
          </div>
          <Link href={`/generation/${generation.id}`} className="field-dex__charts-link">
            Charts
          </Link>
        </div>
      </div>

      <div className="field-dex__screen">
        <DexScreen
          generation={generation}
          pokemon={pokemon}
          selected={selected}
          rival={rival}
          position={index + 1}
          tab={tab}
          onTab={setTab}
          onSelect={setSelectedId}
          onRival={setRivalId}
          onSwap={swap}
        />
      </div>

      <div className="field-dex__pad-area">
        <div className="field-dex__pad" role="group" aria-label="Direction pad">
          <button type="button" className="field-dex__pad-key field-dex__pad-key--up" aria-label="Previous entry" onClick={() => browse(-1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 10 L8 5 L13 10" />
            </svg>
          </button>
          <button type="button" className="field-dex__pad-key field-dex__pad-key--left" aria-label="Previous tab" onClick={() => switchTab(-1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M10 3 L5 8 L10 13" />
            </svg>
          </button>
          <span className="field-dex__pad-center" aria-hidden="true">
            <span />
          </span>
          <button type="button" className="field-dex__pad-key field-dex__pad-key--right" aria-label="Next tab" onClick={() => switchTab(1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 3 L11 8 L6 13" />
            </svg>
          </button>
          <button type="button" className="field-dex__pad-key field-dex__pad-key--down" aria-label="Next entry" onClick={() => browse(1)}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 6 L8 11 L13 6" />
            </svg>
          </button>
        </div>
        <div className="field-dex__slots" aria-hidden="true">
          <span />
          <span />
        </div>
      </div>

      <div className="field-dex__buttons-area">
        <div className="field-dex__buttons">
          <div className="field-dex__button-group">
            <button type="button" className="field-dex__round field-dex__round--a" aria-label="Next tab" onClick={() => switchTab(1)}>
              A
            </button>
            <span className="field-dex__button-label">Tab</span>
          </div>
          <div className="field-dex__button-group">
            <button type="button" className="field-dex__round field-dex__round--b" aria-label="Random entry" onClick={random}>
              B
            </button>
            <span className="field-dex__button-label">Random</span>
          </div>
        </div>
        <div className="field-dex__jumps">
          <button type="button" className="field-dex__jump" aria-label="First entry" onClick={() => setSelectedId(first.id)}>
            {formatDexNumber(first.id)}
          </button>
          <button type="button" className="field-dex__jump" aria-label="Last entry" onClick={() => setSelectedId(last.id)}>
            {formatDexNumber(last.id)}
          </button>
        </div>
      </div>

      <div className="field-dex__list">
        <DexSearchList
          entries={entries}
          types={types}
          query={query}
          type={typeFilter}
          selectedId={selected.id}
          onQuery={setQuery}
          onType={setTypeFilter}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}
