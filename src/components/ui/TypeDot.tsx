import { typeStyle } from '@/lib/style';

interface TypeDotProps {
  /** A type name, or null for the white "all types" dot. */
  type: string | null;
  size?: 'small' | 'medium';
}

/** The outlined color swatch that marks a type everywhere on the page. */
export function TypeDot({ type, size = 'medium' }: TypeDotProps) {
  return (
    <span
      className={`type-dot type-dot--${size}${type ? '' : ' type-dot--all'}`}
      style={type ? typeStyle(type) : undefined}
      aria-hidden="true"
    />
  );
}
