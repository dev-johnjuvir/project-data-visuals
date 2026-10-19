interface StatTileProps {
  label: string;
  value: string | number;
  detail?: string;
  /** Yellow "featured" tile. */
  accent?: boolean;
}

/** When the story is one number, the number is the chart. */
export function StatTile({ label, value, detail, accent }: StatTileProps) {
  return (
    <div className={`stat-tile${accent ? ' stat-tile--accent' : ''}`}>
      <p className="stat-tile__label">{label}</p>
      <p className="stat-tile__value">{value}</p>
      {detail && <p className="stat-tile__detail">{detail}</p>}
    </div>
  );
}
