interface SpinnerProps {
  /** Announced to screen readers. */
  label: string;
  size?: 'small' | 'large';
}

export function Spinner({ label, size = 'large' }: SpinnerProps) {
  return (
    <span className={`spinner spinner--${size}`} role="status">
      <span className="spinner__ring" aria-hidden="true" />
      <span className="spinner__label">{label}</span>
    </span>
  );
}
