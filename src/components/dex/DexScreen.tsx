import { useMemo } from 'react';
import { formatHeight, formatWeight, rankEntry, statExtremes } from '@/lib/dex';
import type { Generation } from '@/lib/generations';
import { capitalize, formatDexNumber, formatName, formatPercent } from '@/lib/transforms';
import { pct, typeStyle } from '@/lib/style';
import { STAT_KEYS, STAT_LABELS, type Pokemon } from '@/lib/types';
import { CryButton } from '@/components/ui/CryButton';
import { SpriteScreen } from '@/components/ui/SpriteScreen';
import { StatRadar } from './StatRadar';

export const TABS = ['stats', 'info', 'rank'] as const;
export type Tab = (typeof TABS)[number];

const MAX_STAT = 255;

/** Traffic-light bands for a single base stat. */
function band(value: number): 'high' | 'mid' | 'low' {
  return value >= 90 ? 'high' : value >= 60 ? 'mid' : 'low';
}

interface DexScreenProps {
  generation: Generation;
  pokemon: Pokemon[];
  selected: Pokemon;
  position: number;
  tab: Tab;
  onTab: (tab: Tab) => void;
  onSelect: (id: number) => void;
}

/** The device's LCD: the scanned entry, with STATS / INFO / RANK tabs. */
export function DexScreen({ generation, pokemon, selected, position, tab, onTab, onSelect }: DexScreenProps) {
  return (
    <section className="dex-screen" aria-label="Entry screen">
      <div className="dex-screen__status" aria-hidden="true">
        <span className="dex-screen__status-dot" />
        <span className="dex-screen__status-label">Scan</span>
      </div>

      <div className="dex-screen__lcd">
        {/* Fixed header: who's on screen. key = remount per entry, so the
            sprite's spinner and the cry button start fresh. */}
        <div className="dex-screen__head">
          <SpriteScreen key={selected.id} src={selected.sprite} name={formatName(selected.name)} size="compact" />
          <div className="dex-screen__identity">
            <span className="dex-screen__number">No. {formatDexNumber(selected.id).slice(1)}</span>
            <h1 className="dex-screen__name">{formatName(selected.name)}</h1>
            <div className="dex-screen__types">
              {selected.types.map((type) => (
                <span key={type} className="dex-screen__type" style={typeStyle(type)}>
                  {capitalize(type)}
                </span>
              ))}
              <CryButton key={selected.id} src={selected.cry} name={formatName(selected.name)} />
            </div>
          </div>
        </div>

        <div className="dex-screen__tabs" role="group" aria-label="Screen tab">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`dex-screen__tab${t === tab ? ' dex-screen__tab--active' : ''}`}
              aria-pressed={t === tab}
              onClick={() => onTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* The only part that scrolls. The scrollbar is hidden, so the area
            is focusable (keyboard users can scroll it with the arrow keys
            and Page Up/Down) and a fade at the bottom hints at more below.
            key = a fresh scroll position for every tab and entry. */}
        <div
          key={`${tab}-${selected.id}`}
          className="dex-screen__body"
          tabIndex={0}
          role="region"
          aria-label={`${tab} for ${formatName(selected.name)}`}
        >
          {tab === 'stats' && <StatsTab selected={selected} />}
          {tab === 'info' && <InfoTab selected={selected} />}
          {tab === 'rank' && <RankTab generation={generation} pokemon={pokemon} selected={selected} onSelect={onSelect} />}
        </div>

        <div className="dex-screen__footer">
          <span>
            Entry {position} / {pokemon.length}
          </span>
          <span>Pad: up and down browse, left and right switch tabs</span>
        </div>
      </div>
    </section>
  );
}

function StatsTab({ selected }: { selected: Pokemon }) {
  return (
    <div className="dex-screen__stats">
      <div className="dex-screen__radar">
        <StatRadar pokemon={selected} />
      </div>
      <div className="dex-screen__bars">
        {STAT_KEYS.map((key) => {
          const value = selected.stats[key];
          return (
            <div key={key} className="dex-screen__bar">
              <span className="dex-screen__bar-label">{STAT_LABELS[key]}</span>
              <span className="dex-screen__bar-track">
                <span
                  className={`dex-screen__bar-fill dex-screen__bar-fill--${band(value)}`}
                  style={{ width: pct(Math.max(0.04, value / MAX_STAT)) }}
                />
              </span>
              <span className="dex-screen__bar-value">{value}</span>
            </div>
          );
        })}
        <div className="dex-screen__total">
          <span className="dex-screen__total-label">Total</span>
          <span className="dex-screen__total-value">{selected.total}</span>
        </div>
      </div>
    </div>
  );
}

function InfoTab({ selected }: { selected: Pokemon }) {
  const { best, worst } = statExtremes(selected);
  const facts = [
    { label: 'Height', value: formatHeight(selected.height) },
    { label: 'Weight', value: formatWeight(selected.weight) },
    { label: 'Typing', value: selected.types.map(capitalize).join(' / ') },
    { label: 'Best stat', value: `${best.label} ${best.value}` },
    { label: 'Lowest stat', value: `${worst.label} ${worst.value}` },
    { label: 'Base total', value: String(selected.total) },
  ];

  return (
    <dl className="dex-screen__facts">
      {facts.map((fact) => (
        <div key={fact.label} className="dex-screen__card">
          <dt className="dex-screen__card-label">{fact.label}</dt>
          <dd className="dex-screen__card-value">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface RankTabProps {
  generation: Generation;
  pokemon: Pokemon[];
  selected: Pokemon;
  onSelect: (id: number) => void;
}

function RankTab({ generation, pokemon, selected, onSelect }: RankTabProps) {
  const ranking = useMemo(() => rankEntry(pokemon, selected), [pokemon, selected]);

  return (
    <div className="dex-screen__rank">
      <div className="dex-screen__rank-cards">
        <div className="dex-screen__card">
          <div className="dex-screen__card-label">Region rank</div>
          <div className="dex-screen__card-value dex-screen__card-value--big">
            {ranking.rank} <small>of {pokemon.length}</small>
          </div>
        </div>
        <div className="dex-screen__card">
          <div className="dex-screen__card-label">{selected.primaryType} rank</div>
          <div className="dex-screen__card-value dex-screen__card-value--big">
            {ranking.typeRank} <small>of {ranking.typeCount}</small>
          </div>
        </div>
      </div>

      <div className="dex-screen__beats">
        <span>
          Outscores {formatPercent(ranking.beats)} of Region {generation.numeral} by base total.
        </span>
        <span className="dex-screen__beats-track" aria-hidden="true">
          <span className="dex-screen__beats-fill" style={{ width: pct(ranking.beats) }} />
        </span>
      </div>

      <div className="dex-screen__nearest">
        <span className="dex-screen__card-label">Nearest by total</span>
        {ranking.nearest.map((p) => (
          <button key={p.id} type="button" className="dex-screen__near" onClick={() => onSelect(p.id)}>
            <span className="dex-screen__near-number">{formatDexNumber(p.id)}</span>
            <span className="dex-screen__near-name">{formatName(p.name)}</span>
            <span className="dex-screen__near-total">{p.total}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
