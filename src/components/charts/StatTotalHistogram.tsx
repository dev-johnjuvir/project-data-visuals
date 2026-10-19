import { max } from 'd3';
import { capitalize, totalBinIndex, type TotalBin } from '@/lib/transforms';
import { pct, typeStyle } from '@/lib/style';
import type { Pokemon } from '@/lib/types';

// Lesson: a histogram shows the *shape* of one measure - where values
// cluster and how spread out they are. Bin width is a design decision: too
// wide hides structure, too narrow turns into noise. The ringed bar is the
// bin the scanned Pokémon falls in, tying this chart to the scanner.

interface StatTotalHistogramProps {
  bins: TotalBin[];
  highlight: string | null;
  selected: Pokemon;
}

export function StatTotalHistogram({ bins, highlight, selected }: StatTotalHistogramProps) {
  const tallest = max(bins, (b) => b.members.length) || 1;
  const selectedBin = totalBinIndex(selected.total);

  return (
    <div className="histogram">
      <div className="histogram__plot" role="img" aria-label="Histogram of base stat totals. Switch to Table for exact counts.">
        {bins.map((bin, i) => {
          const n = bin.members.length;
          const lit = highlight ? bin.members.filter((p) => p.primaryType === highlight).length : 0;
          const modifiers = [
            highlight && 'histogram__bar--dimmed',
            n === 0 && 'histogram__bar--empty',
            i === selectedBin && 'histogram__bar--selected',
          ].filter(Boolean);
          const tip = `${bin.lo}–${bin.hi}: ${n} entries${highlight ? `, ${lit} ${capitalize(highlight)}` : ''}`;
          return (
            <div key={bin.lo} className="histogram__column" title={tip}>
              <span className="histogram__count">{n || ''}</span>
              {/* Bars top out at 92% so the count label above always fits */}
              <div className={['histogram__bar', ...modifiers].join(' ')} style={{ height: pct((n / tallest) * 0.92) }}>
                {highlight && lit > 0 && (
                  <div className="histogram__highlight" style={typeStyle(highlight, { height: pct(lit / n) })} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="histogram__labels" aria-hidden="true">
        {bins.map((bin) => (
          <span key={bin.lo} className="histogram__label">
            {bin.lo % 100 === 0 ? bin.lo : ''}
          </span>
        ))}
      </div>
      <p className="histogram__axis-title">Base stat total</p>
    </div>
  );
}
