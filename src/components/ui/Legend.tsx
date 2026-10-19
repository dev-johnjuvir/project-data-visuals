export interface LegendItem {
  label: string;
  /** A CSS color, usually a token such as var(--series-1). */
  color: string;
}

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="legend" aria-label="Legend">
      {items.map((item) => (
        <li key={item.label} className="legend__item">
          <span className="legend__swatch" style={{ background: item.color }} aria-hidden="true" />
          <span className="legend__label">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
