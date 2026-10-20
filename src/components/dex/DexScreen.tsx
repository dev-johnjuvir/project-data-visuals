import { useMemo, type CSSProperties, type ReactNode } from 'react';
import { compareStats, formatHeight, formatWeight, rankEntry, statExtremes, type Side } from '@/lib/dex';
import type { Generation } from '@/lib/generations';
import { capitalize, formatDexNumber, formatName, formatPercent } from '@/lib/transforms';
import { scrollSfxProps } from '@/lib/sfx';
import { pct, typeStyle } from '@/lib/style';
import { STAT_KEYS, STAT_LABELS, STAT_SHORT_LABELS, type MoveCategory, type Pokemon, type PokemonDetails } from '@/lib/types';
import { CryButton } from '@/components/ui/CryButton';
import { SpriteScreen } from '@/components/ui/SpriteScreen';
import { Spinner } from '@/components/ui/Spinner';
import { TypeDot } from '@/components/ui/TypeDot';
import { usePokemonDetails } from '@/hooks/usePokemonDetails';
import { StatRadar } from './StatRadar';

export const TABS = ['stats', 'info', 'skills', 'rank', 'vs'] as const;
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
  /** The entry the VS tab pits against the selected one. */
  rival: Pokemon;
  position: number;
  tab: Tab;
  onTab: (tab: Tab) => void;
  onSelect: (id: number) => void;
  onRival: (id: number) => void;
  onSwap: () => void;
}

/** The device's LCD: the scanned entry, with STATS / INFO / SKILLS / RANK / VS tabs. */
export function DexScreen({ generation, pokemon, selected, rival, position, tab, onTab, onSelect, onRival, onSwap }: DexScreenProps) {
  const scrollSfx = useMemo(scrollSfxProps, []);
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
            <span className="dex-screen__number">No. {formatDexNumber(selected.species).slice(1)}</span>
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
          {...scrollSfx}
          tabIndex={0}
          role="region"
          aria-label={`${tab} for ${formatName(selected.name)}`}
        >
          {tab === 'stats' && <StatsTab selected={selected} />}
          {tab === 'info' && <InfoTab pokemon={pokemon} selected={selected} onSelect={onSelect} />}
          {tab === 'skills' && <DetailsTab selected={selected} render={(details) => <SkillsTab details={details} />} />}
          {tab === 'rank' && <RankTab generation={generation} pokemon={pokemon} selected={selected} onSelect={onSelect} />}
          {tab === 'vs' && <VsTab pokemon={pokemon} selected={selected} rival={rival} onRival={onRival} onSwap={onSwap} />}
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

interface InfoTabProps {
  pokemon: Pokemon[];
  selected: Pokemon;
  onSelect: (id: number) => void;
}

function InfoTab({ pokemon, selected, onSelect }: InfoTabProps) {
  const { best, worst } = statExtremes(selected);
  const facts = [
    { label: 'Height', value: formatHeight(selected.height) },
    { label: 'Weight', value: formatWeight(selected.weight) },
    { label: 'Typing', value: selected.types.map(capitalize).join(' / ') },
    { label: 'Best stat', value: `${best.label} ${best.value}` },
    { label: 'Lowest stat', value: `${worst.label} ${worst.value}` },
    { label: 'Base total', value: String(selected.total) },
  ];

  // The facts come with the region data and show at once; abilities are
  // fetched per entry, so they load in underneath.
  return (
    <div className="dex-screen__info">
      <dl className="dex-screen__facts">
        {facts.map((fact) => (
          <div key={fact.label} className="dex-screen__card">
            <dt className="dex-screen__card-label">{fact.label}</dt>
            <dd className="dex-screen__card-value">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <DetailsTab
        selected={selected}
        render={(details) => (
          <>
            <EvolutionLine details={details} pokemon={pokemon} selected={selected} onSelect={onSelect} />
            <FormList details={details} pokemon={pokemon} selected={selected} onSelect={onSelect} />
            <Abilities details={details} />
          </>
        )}
      />
    </div>
  );
}

/** Loading / error / ready wrapper for the parts fed by /api/dex/[id]. */
function DetailsTab({ selected, render }: { selected: Pokemon; render: (details: PokemonDetails) => ReactNode }) {
  const state = usePokemonDetails(selected.id);
  if (state.status === 'loading') {
    return (
      <div className="dex-screen__message">
        <Spinner size="small" label={`Loading ${formatName(selected.name)}'s data`} />
        <span aria-hidden="true">Scanning...</span>
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="dex-screen__message">
        <span>Couldn&apos;t reach the Pokédex database.</span>
        <button type="button" className="dex-screen__retry" onClick={state.retry}>
          Retry
        </button>
      </div>
    );
  }
  return render(state.details);
}

interface EvolutionLineProps {
  details: PokemonDetails;
  pokemon: Pokemon[];
  selected: Pokemon;
  onSelect: (id: number) => void;
}

/** The line left to right, one column per stage. In-region members are buttons. */
function EvolutionLine({ details, pokemon, selected, onSelect }: EvolutionLineProps) {
  const inRegion = useMemo(() => new Set(pokemon.map((p) => p.id)), [pokemon]);
  const { evolution } = details;

  return (
    <section className="dex-screen__evolution" aria-label="Evolution line">
      <span className="dex-screen__card-label">Evolution line</span>
      {evolution.length <= 1 ? (
        <p className="dex-screen__fineprint">{formatName(selected.name)} doesn&apos;t evolve.</p>
      ) : (
        <ol className="dex-screen__stages">
          {evolution.map((stage, i) => (
            <li key={i} className={`dex-screen__stage${stage.length > 2 ? ' dex-screen__stage--branch' : ''}`}>
              {stage.map((member) => {
                // By species, so Mega Charizard X still lights up Charizard.
                const current = member.id === selected.species;
                const body = (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element -- pixel sprite, see SpriteScreen */}
                    <img className="dex-screen__evo-sprite" src={member.sprite} alt="" width={56} height={56} />
                    <span className="dex-screen__evo-name">{formatName(member.name)}</span>
                    {member.condition && <span className="dex-screen__evo-how">{member.condition}</span>}
                  </>
                );
                const className = `dex-screen__evo${current ? ' dex-screen__evo--current' : ''}`;
                return inRegion.has(member.id) && member.id !== selected.id ? (
                  <button key={member.id} type="button" className={className} onClick={() => onSelect(member.id)}>
                    {body}
                  </button>
                ) : (
                  <span key={member.id} className={className} aria-current={current ? 'true' : undefined}>
                    {body}
                  </span>
                );
              })}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Megas, regional forms and the like. Forms that play differently are in
 *  the entry list too, so their cards jump there; cosmetic ones aren't. */
function FormList({ details, pokemon, selected, onSelect }: EvolutionLineProps) {
  const entryIds = useMemo(() => new Map(pokemon.map((p) => [p.name, p.id])), [pokemon]);
  const { forms } = details;
  if (forms.length <= 1) return null;
  const baseTotal = forms.find((f) => f.isDefault)?.total ?? forms[0].total;

  return (
    <section className="dex-screen__evolution" aria-label="Forms">
      <span className="dex-screen__card-label">Forms</span>
      <div className="dex-screen__forms">
        {forms.map((form) => {
          const current = form.name === selected.name;
          const entryId = entryIds.get(form.name);
          const delta = form.total - baseTotal;
          const body = (
            <>
              {form.sprite ? (
                // eslint-disable-next-line @next/next/no-img-element -- pixel sprite, see SpriteScreen
                <img className="dex-screen__evo-sprite" src={form.sprite} alt="" width={56} height={56} />
              ) : (
                <span className="dex-screen__evo-sprite" aria-hidden="true" />
              )}
              <span className="dex-screen__evo-name">{form.label}</span>
              <span className="dex-screen__form-types">
                {form.types.map((type) => (
                  <TypeDot key={type} type={type} size="small" />
                ))}
              </span>
              <span className="dex-screen__evo-how">
                {form.types.map(capitalize).join(' / ')}
                <br />
                Total {form.total}
                {delta !== 0 && ` (${delta > 0 ? '+' : ''}${delta})`}
              </span>
              {form.mega && <span className="dex-screen__tag dex-screen__tag--strong">Mega</span>}
            </>
          );
          const className = `dex-screen__evo${current ? ' dex-screen__evo--current' : ''}`;
          return entryId !== undefined && !current ? (
            <button key={form.name} type="button" className={className} onClick={() => onSelect(entryId)}>
              {body}
            </button>
          ) : (
            <span key={form.name} className={className} aria-current={current ? 'true' : undefined}>
              {body}
            </span>
          );
        })}
      </div>
    </section>
  );
}

/** "scarlet-violet" -> "Scarlet / Violet" */
const formatGame = (group: string) => group.split('-').map(capitalize).join(' / ');

const holdersText = (holders: number) =>
  holders <= 1 ? 'Exclusive: no other species has it' : `Shared with ${holders - 1} other species`;

function Abilities({ details }: { details: PokemonDetails }) {
  const signature = details.abilities.find((a) => a.name === details.signature)!;
  const others = details.abilities.filter((a) => a !== signature);

  return (
    <div className="dex-screen__abilities">
      <div className="dex-screen__card dex-screen__card--signature">
        <span className="dex-screen__card-label">Signature ability</span>
        <span className="dex-screen__ability-name">
          {formatName(signature.name)}
          {signature.hidden && <span className="dex-screen__tag">Hidden</span>}
          {signature.holders <= 1 && <span className="dex-screen__tag dex-screen__tag--strong">Exclusive</span>}
        </span>
        <p className="dex-screen__ability-effect">{signature.effect}</p>
        <span className="dex-screen__ability-holders">{holdersText(signature.holders)}</span>
      </div>

      {others.length > 0 && (
        <>
          <span className="dex-screen__card-label">Also possible</span>
          {others.map((ability) => (
            <div key={ability.name} className="dex-screen__card">
              <span className="dex-screen__ability-name dex-screen__ability-name--small">
                {formatName(ability.name)}
                {ability.hidden && <span className="dex-screen__tag">Hidden</span>}
              </span>
              <p className="dex-screen__ability-effect">{ability.effect}</p>
              <span className="dex-screen__ability-holders">{holdersText(ability.holders)}</span>
            </div>
          ))}
        </>
      )}
      <p className="dex-screen__fineprint">Signature = the rarest ability this species can have.</p>
    </div>
  );
}

const CATEGORY_LABELS: Record<MoveCategory, string> = { physical: 'Phys', special: 'Spec', status: 'Status' };

function SkillsTab({ details }: { details: PokemonDetails }) {
  if (details.moves.length === 0) {
    return <p className="dex-screen__message">No level-up moves on record.</p>;
  }

  return (
    <div className="dex-screen__skills">
      <p className="dex-screen__fineprint">
        {details.moves.length} level-up moves · {formatGame(details.versionGroup)}
      </p>
      <table className="dex-screen__moves">
        <thead>
          <tr>
            <th scope="col">Lv</th>
            <th scope="col">Move</th>
            <th scope="col">Pow</th>
            <th scope="col">Acc</th>
          </tr>
        </thead>
        <tbody>
          {details.moves.map((move) => (
            <tr key={`${move.level}-${move.name}`}>
              <td className="dex-screen__move-level">{move.level === 0 ? 'Evo' : move.level}</td>
              <th scope="row" className="dex-screen__move">
                <span className="dex-screen__move-name">{formatName(move.name)}</span>
                <span className="dex-screen__move-meta">
                  <TypeDot type={move.type} size="small" />
                  {capitalize(move.type)} · {CATEGORY_LABELS[move.category]}
                </span>
              </th>
              <td>{move.power ?? '-'}</td>
              <td>{move.accuracy === null ? '-' : `${move.accuracy}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
            <span className="dex-screen__near-number">{formatDexNumber(p.species)}</span>
            <span className="dex-screen__near-name">{formatName(p.name)}</span>
            <span className="dex-screen__near-total">{p.total}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface VsTabProps {
  pokemon: Pokemon[];
  selected: Pokemon;
  rival: Pokemon;
  onRival: (id: number) => void;
  onSwap: () => void;
}

// Lesson: a "butterfly" chart - two bar charts back to back on a shared
// axis. Each bar grows outward from the stat label in the middle, both on
// the same fixed 0-255 scale, so the longer side wins at a glance. The
// losing bar is faded rather than hidden, so you still see by how much.
function VsTab({ pokemon, selected, rival, onRival, onSwap }: VsTabProps) {
  const matchup = useMemo(() => compareStats(selected, rival), [selected, rival]);
  const names = { left: formatName(selected.name), right: formatName(rival.name) };
  const verdict =
    matchup.total.winner === 'tie'
      ? `Dead even at ${matchup.total.left} total.`
      : `${names[matchup.total.winner]} leads by ${Math.abs(matchup.total.left - matchup.total.right)} total.`;
  const barClass = (side: 'left' | 'right', won: Side) =>
    `dex-screen__vs-fill dex-screen__vs-fill--${side}${won !== side && won !== 'tie' ? ' dex-screen__vs-fill--lost' : ''}`;
  const valueClass = (side: 'left' | 'right', won: Side) =>
    `dex-screen__vs-value${won === side ? ' dex-screen__vs-value--won' : ''}`;

  return (
    <div className="dex-screen__vs">
      <div className="dex-screen__vs-picker">
        <label className="dex-screen__vs-field">
          <span className="dex-screen__card-label">Rival</span>
          <select className="dex-screen__vs-select" value={rival.id} onChange={(e) => onRival(Number(e.target.value))}>
            {pokemon.map((p) => (
              <option key={p.id} value={p.id}>
                {formatDexNumber(p.species)} {formatName(p.name)}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="dex-screen__vs-swap" onClick={onSwap} aria-label={`Swap: scan ${names.right} instead`}>
          Swap
        </button>
      </div>

      <div className="dex-screen__radar">
        <StatRadar pokemon={selected} rival={rival} />
      </div>
      <div className="dex-screen__vs-legend">
        <span className="dex-screen__vs-key" style={typeStyle(selected.primaryType)}>
          <span className="dex-screen__vs-swatch" aria-hidden="true" />
          {names.left}
        </span>
        <span className="dex-screen__vs-key" style={typeStyle(rival.primaryType)}>
          <span className="dex-screen__vs-swatch dex-screen__vs-swatch--rival" aria-hidden="true" />
          {names.right}
        </span>
      </div>

      <div className="dex-screen__vs-bars" style={{ ...typeStyle(selected.primaryType), '--rival-color': `var(--type-${rival.primaryType})` } as CSSProperties}>
        {matchup.rows.map((row) => (
          <div
            key={row.key}
            className="dex-screen__vs-row"
            role="img"
            aria-label={`${STAT_LABELS[row.key]}: ${names.left} ${row.left}, ${names.right} ${row.right}`}
          >
            <span className={valueClass('left', row.winner)}>{row.left}</span>
            <span className="dex-screen__vs-track dex-screen__vs-track--left">
              <span className={barClass('left', row.winner)} style={{ width: pct(Math.max(0.04, row.left / MAX_STAT)) }} />
            </span>
            <span className="dex-screen__vs-label">{STAT_SHORT_LABELS[row.key]}</span>
            <span className="dex-screen__vs-track">
              <span className={barClass('right', row.winner)} style={{ width: pct(Math.max(0.04, row.right / MAX_STAT)) }} />
            </span>
            <span className={valueClass('right', row.winner)}>{row.right}</span>
          </div>
        ))}
        <div className="dex-screen__vs-row dex-screen__vs-row--total">
          <span className={valueClass('left', matchup.total.winner)}>{matchup.total.left}</span>
          <span className="dex-screen__vs-total-label">Total</span>
          <span className={valueClass('right', matchup.total.winner)}>{matchup.total.right}</span>
        </div>
      </div>

      <p className="dex-screen__vs-verdict">
        {verdict} Stats won: {names.left} {matchup.wins.left}, {names.right} {matchup.wins.right}.
      </p>
    </div>
  );
}
