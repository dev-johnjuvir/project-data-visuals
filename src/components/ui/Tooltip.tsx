import type { ReactNode } from 'react';

interface TooltipProps {
  /** Anchor point in px, relative to the chart container. */
  x: number;
  y: number;
  containerWidth: number;
  children: ReactNode;
}

/** Floats beside the hovered mark; flips left near the right edge. */
export function Tooltip({ x, y, containerWidth, children }: TooltipProps) {
  const flip = x > containerWidth * 0.6;
  return (
    <div className={`tooltip${flip ? ' tooltip--flip' : ''}`} style={{ left: x, top: y }} role="status">
      {children}
    </div>
  );
}

interface TooltipRowProps {
  label: string;
  value: ReactNode;
  color?: string;
}

export function TooltipRow({ label, value, color }: TooltipRowProps) {
  return (
    <div className="tooltip__row">
      {color && <span className="tooltip__swatch" style={{ background: color }} aria-hidden="true" />}
      <span className="tooltip__label">{label}</span>
      <span className="tooltip__value">{value}</span>
    </div>
  );
}
