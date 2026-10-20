import { STAT_KEYS, STAT_LABELS, type Pokemon } from '@/lib/types';
import { formatName } from '@/lib/transforms';
import { typeStyle } from '@/lib/style';

// Lesson: a radar (spider) chart shows a *shape* - is this Pokémon an
// all-rounder or a glass cannon? It's poor for reading exact values (angles
// and areas are hard to judge), which is why the screen pairs it with bars
// and numbers. Use a radar for the gist, never on its own.
//
// With a rival, two shapes share one set of axes. The rival is drawn on top
// with a dashed outline and a see-through fill, so neither shape hides the
// other and the dash (not just the color) tells them apart - two Fire types
// would otherwise wear the same fill.

const CX = 120;
const CY = 120;
const RADIUS = 95;
/** Stats above this reach the edge, so one huge stat doesn't shrink the rest. */
const CAP = 180;
const RINGS = [1, 2 / 3, 1 / 3];

// Six axes, starting at 12 o'clock and going clockwise.
const angle = (i: number) => ((-90 + 60 * i) * Math.PI) / 180;
const point = (i: number, r: number) =>
  `${(CX + r * Math.cos(angle(i))).toFixed(1)},${(CY + r * Math.sin(angle(i))).toFixed(1)}`;
const ring = (scale: number) => STAT_KEYS.map((_, i) => point(i, RADIUS * scale)).join(' ');
const shape = (p: Pokemon) => STAT_KEYS.map((key, i) => point(i, (Math.min(p.stats[key], CAP) / CAP) * RADIUS)).join(' ');
const summary = (p: Pokemon) => STAT_KEYS.map((key) => `${STAT_LABELS[key]} ${p.stats[key]}`).join(', ');

const AXIS_LABELS = [
  { text: 'HP', x: 120, y: 14, anchor: 'middle' },
  { text: 'ATK', x: 210, y: 68, anchor: 'start' },
  { text: 'DEF', x: 210, y: 180, anchor: 'start' },
  { text: 'SP.ATK', x: 120, y: 238, anchor: 'middle' },
  { text: 'SP.DEF', x: 30, y: 180, anchor: 'end' },
  { text: 'SPD', x: 30, y: 68, anchor: 'end' },
] as const;

interface StatRadarProps {
  pokemon: Pokemon;
  /** Overlay a second entry's shape for a head-to-head. */
  rival?: Pokemon;
}

export function StatRadar({ pokemon, rival }: StatRadarProps) {
  const label = rival
    ? `Stat shapes. ${formatName(pokemon.name)}: ${summary(pokemon)}. ${formatName(rival.name)}: ${summary(rival)}`
    : `Stat shape: ${summary(pokemon)}`;

  return (
    <svg className="stat-radar" viewBox="-44 0 328 250" role="img" aria-label={label}>
      {RINGS.map((scale) => (
        <polygon key={scale} className={`stat-radar__ring${scale === 1 ? ' stat-radar__ring--outer' : ''}`} points={ring(scale)} />
      ))}
      <polygon
        className={`stat-radar__shape${rival ? ' stat-radar__shape--under' : ''}`}
        points={shape(pokemon)}
        style={typeStyle(pokemon.primaryType)}
      />
      {rival && (
        <polygon className="stat-radar__shape stat-radar__shape--rival" points={shape(rival)} style={typeStyle(rival.primaryType)} />
      )}
      {AXIS_LABELS.map((axis) => (
        <text key={axis.text} className="stat-radar__label" x={axis.x} y={axis.y} textAnchor={axis.anchor}>
          {axis.text}
        </text>
      ))}
    </svg>
  );
}
