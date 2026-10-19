import { capitalize, formatPercent, type TypeCount } from '@/lib/transforms';
import { pct, typeStyle } from '@/lib/style';

// Lesson: ranked bars are the most honest way to show shares across many
// categories - lengths are easy to compare, and every type gets a row.
// Each bar is scaled to the LARGEST type (not to 100%), so the differences
// fill the space; the exact count and percentage sit at the end of the row.

interface TypeShareBarsProps {
  data: TypeCount[];
  total: number;
  highlight: string | null;
  onToggle: (type: string) => void;
}

export function TypeShareBars({ data, total, highlight, onToggle }: TypeShareBarsProps) {
  const largest = data[0]?.count ?? 1;

  return (
    <div className="share-bars">
      {data.map(({ type, count }) => {
        const share = formatPercent(count / total);
        const isActive = highlight === type;
        const isDimmed = highlight !== null && !isActive;
        return (
          <button
            key={type}
            type="button"
            className={`share-bars__row${isDimmed ? ' share-bars__row--dimmed' : ''}`}
            aria-pressed={isActive}
            aria-label={`${capitalize(type)}, ${count} entries, ${share}. ${isActive ? 'Clear highlight' : 'Highlight this type'}.`}
            onClick={() => onToggle(type)}
          >
            <span className="share-bars__type">{capitalize(type)}</span>
            <span className="share-bars__track">
              <span className="share-bars__fill" style={typeStyle(type, { width: pct(count / largest) })} />
            </span>
            <span className="share-bars__value">
              <b>{count}</b> · {share}
            </span>
          </button>
        );
      })}
    </div>
  );
}
