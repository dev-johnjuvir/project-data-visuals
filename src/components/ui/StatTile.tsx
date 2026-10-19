interface StatTileProps {
  label: string;
  value: string | number;
  detail?: string;
}

/** When the story is one number, the number is the chart. */
export function StatTile({ label, value, detail }: StatTileProps) {
  return (
    <div className="stat-tile">
      <p className="stat-tile__label">{label}</p>
      <p className="stat-tile__value">{value}</p>
      {detail && <p className="stat-tile__detail">{detail}</p>}
    </div>
  );
}
