// SVG path helpers for bars that are rounded only at the data end.
// The baseline end stays square so the bar visibly "grows" from the axis.

const RADIUS = 4;

/** Horizontal bar from x to x+width, rounded on the right. */
export function horizontalBarPath(x: number, y: number, width: number, height: number): string {
  if (width <= 0) return '';
  const r = Math.min(RADIUS, width, height / 2);
  const right = x + width;
  return [
    `M${x},${y}`,
    `H${right - r}`,
    `A${r},${r} 0 0 1 ${right},${y + r}`,
    `V${y + height - r}`,
    `A${r},${r} 0 0 1 ${right - r},${y + height}`,
    `H${x}`,
    'Z',
  ].join('');
}

/** Vertical bar whose baseline sits at y+height, rounded on top. */
export function verticalBarPath(x: number, y: number, width: number, height: number): string {
  if (height <= 0 || width <= 0) return '';
  const r = Math.min(RADIUS, height, width / 2);
  const bottom = y + height;
  return [
    `M${x},${bottom}`,
    `V${y + r}`,
    `A${r},${r} 0 0 1 ${x + r},${y}`,
    `H${x + width - r}`,
    `A${r},${r} 0 0 1 ${x + width},${y + r}`,
    `V${bottom}`,
    'Z',
  ].join('');
}
