import type { ReactNode } from 'react';

interface ChartSvgProps {
  /** The width the chart was drawn for (measured, or the server default). */
  width: number;
  height: number;
  label: string;
  children: ReactNode;
}

/**
 * The SVG root every chart shares. The viewBox makes the drawing scale to its
 * container, so the server-rendered chart fits before JS has measured
 * anything. Height stays fixed so the card never changes size on hydration.
 */
export function ChartSvg({ width, height, label, children }: ChartSvgProps) {
  return (
    <svg
      className="chart__svg"
      width="100%"
      height={height}
      viewBox={`0 0 ${Math.max(width, 1)} ${height}`}
      preserveAspectRatio="xMinYMin meet"
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  );
}
