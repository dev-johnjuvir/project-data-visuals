import { capitalize, formatDexNumber, formatName, formatSigned } from '@/lib/transforms';
import { typeStyle } from '@/lib/style';
import type { Pokemon } from '@/lib/types';
import { SpriteScreen } from '@/components/ui/SpriteScreen';

interface StatScannerProps {
  pokemon: Pokemon;
  averageTotal: number;
  regionLabel: string;
  onPrev: () => void;
  onNext: () => void;
}

/** The "scanned entry" card: who it is, and how its total compares. */
export function StatScanner({ pokemon, averageTotal, regionLabel, onPrev, onNext }: StatScannerProps) {
  const delta = pokemon.total - averageTotal;
  const line =
    delta === 0
      ? `Base total ${pokemon.total}, right on the ${regionLabel} average.`
      : `Base total ${pokemon.total}. That is ${Math.abs(delta)} ${delta < 0 ? 'below' : 'above'} the ${regionLabel} average of ${averageTotal}.`;

  return (
    <div className="scanner">
      {/* Screen + controls form one unit, like a handheld's display and D-pad */}
      <div className="scanner__device">
        <SpriteScreen key={pokemon.sprite ?? pokemon.id} src={pokemon.sprite} name={formatName(pokemon.name)} />
        <div className="scanner__controls">
          <button type="button" className="scanner__nav" aria-label="Previous entry" onClick={onPrev}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M10 3 L5 8 L10 13" />
            </svg>
          </button>
          <button type="button" className="scanner__nav" aria-label="Next entry" onClick={onNext}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M6 3 L11 8 L6 13" />
            </svg>
          </button>
        </div>
      </div>

      <div className="scanner__info">
        <div className="scanner__identity">
          <span className="scanner__number">{formatDexNumber(pokemon.species)}</span>
          <span className="scanner__name">{formatName(pokemon.name)}</span>
        </div>
        <div className="scanner__types">
          {pokemon.types.map((type) => (
            <span key={type} className="scanner__type" style={typeStyle(type)}>
              {capitalize(type)}
            </span>
          ))}
        </div>
        <p className="scanner__line">{line}</p>
      </div>

      <div className="scanner__total">
        <span className="scanner__total-value">{pokemon.total}</span>
        <span className={`scanner__delta scanner__delta--${delta >= 0 ? 'up' : 'down'}`}>
          {formatSigned(delta)} vs avg
        </span>
      </div>
    </div>
  );
}
