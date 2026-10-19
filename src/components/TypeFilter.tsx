import { capitalize } from '@/lib/transforms';
import { TypeDot } from './ui/TypeDot';

interface TypeFilterProps {
  types: string[];
  highlight: string | null;
  onChange: (type: string | null) => void;
}

/** One filter row above everything it scopes - every readout reacts to it. */
export function TypeFilter({ types, highlight, onChange }: TypeFilterProps) {
  const options: (string | null)[] = [null, ...types];

  return (
    <section className="type-filter" aria-label="Highlight type">
      <div className="type-filter__header">
        <h2 className="type-filter__title">Highlight type</h2>
        <p className="type-filter__hint">Dims every other type across all five readouts.</p>
      </div>
      <div className="type-filter__chips">
        {options.map((type) => {
          const isActive = highlight === type;
          return (
            <button
              key={type ?? 'all'}
              type="button"
              className={`type-chip${isActive ? ' type-chip--active' : ''}`}
              aria-pressed={isActive}
              onClick={() => onChange(type)}
            >
              <TypeDot type={type} />
              {type ? capitalize(type) : 'All types'}
            </button>
          );
        })}
      </div>
    </section>
  );
}
