'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { filterEntries, typesInUse } from '@/lib/dex';
import type { Generation } from '@/lib/generations';
import { playSfx, setMuted, useMuted } from '@/lib/sfx';
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
  // The VS tab's opponent starts as the next species (Pikachu vs Raichu,
  // skipping Pikachu's own forms) and stays put while you browse, so one
  // rival can face the whole region.
  const [rivalId, setRivalId] = useState(() => {
    const at = pokemon.findIndex((p) => p.id === selectedId);
    const next = pokemon.slice(at + 1).find((p) => p.species !== pokemon[at].species);
    return (next ?? pokemon[0]).id;
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

  const muted = useMuted();

  // Deep links: /dex/2?entry=172&tab=info opens on Pichu's INFO tab - how
  // an evolution card links to a Pokémon in another region. Read after
  // mount, not during render: the page is pre-built, so the server can't
  // know the query and the first render must match its HTML.
  // The query is captured once: in dev, Strict Mode runs effects twice, and
  // by the second run the effect below has already rewritten the URL.
  const linkedQuery = useRef<string | null>(null);
  useEffect(() => {
    linkedQuery.current ??= window.location.search;
    const params = new URLSearchParams(linkedQuery.current);
    const entry = Number(params.get('entry'));
    const linkedTab = params.get('tab') as Tab | null;
    if (pokemon.some((p) => p.id === entry)) setSelectedId(entry);
    if (linkedTab && TABS.includes(linkedTab)) setTab(linkedTab);
  }, [pokemon]);

  // ...and keep the URL in step, so any entry can be shared or bookmarked.
  // replaceState: browsing shouldn't fill the Back button's history.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('entry', String(selectedId));
    url.searchParams.set('tab', tab);
    window.history.replaceState(window.history.state, '', url);
  }, [selectedId, tab]);

  // Every control goes through these, so each makes its sound in one place:
  // "scroll" moves the cursor, "button" presses a control, "select" picks
  // an entry.
  const select = (id: number) => {
    playSfx('select');
    setSelectedId(id);
  };
  const jump = (id: number) => {
    playSfx('button');
    setSelectedId(id);
  };
  const changeTab = (next: Tab) => {
    playSfx('button');
    setTab(next);
  };
  const changeType = (type: string | null) => {
    playSfx('button');
    setTypeFilter(type);
  };
  const changeRival = (id: number) => {
    playSfx('select');
    setRivalId(id);
  };

  // Browsing wraps around the region; tabs wrap too.
  const browse = (by: number) => {
    playSfx('scroll');
    setSelectedId(pokemon[(index + by + pokemon.length) % pokemon.length].id);
  };
  const switchTab = (by: number) => changeTab(TABS[(TABS.indexOf(tab) + by + TABS.length) % TABS.length]);
  const swap = () => {
    playSfx('button');
    setSelectedId(rival.id);
    setRivalId(selected.id);
  };
  const random = () => {
    // Never "randomly" land on the entry already showing.
    const offset = 1 + Math.floor(Math.random() * (pokemon.length - 1));
    select(pokemon[(index + offset) % pokemon.length].id);
  };
  const toggleSound = () => {
    setMuted(!muted);
    if (muted) playSfx('select'); // confirm sound is back (muted is the old value)
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
          <button
            type="button"
            className="field-dex__sound"
            aria-pressed={!muted}
            aria-label="Sound effects"
            title={muted ? 'Sound off' : 'Sound on'}
            onClick={toggleSound}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <path className="field-dex__sound-speaker" d="M3 8 H6 L10 4 V16 L6 12 H3 Z" />
              {muted ? (
                <path className="field-dex__sound-wave" d="M13 7 L18 13 M18 7 L13 13" />
              ) : (
                <path className="field-dex__sound-wave" d="M13 7 Q15 10 13 13 M15.5 5 Q19 10 15.5 15" />
              )}
            </svg>
          </button>
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
          onTab={changeTab}
          onSelect={select}
          onRival={changeRival}
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
          <button type="button" className="field-dex__jump" aria-label="First entry" onClick={() => jump(first.id)}>
            {formatDexNumber(first.species)}
          </button>
          <button type="button" className="field-dex__jump" aria-label="Last entry" onClick={() => jump(last.id)}>
            {formatDexNumber(last.species)}
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
          onType={changeType}
          onSelect={select}
        />
      </div>
    </div>
  );
}
