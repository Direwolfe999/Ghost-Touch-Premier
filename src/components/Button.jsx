import { color } from '../lib/tokens';

export default function Button({ children, onClick, variant = 'primary', disabled, loading = false, className, style }) {
  const isDisabled = disabled || loading;
  const base = {
    fontFamily: 'inherit',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 10,
    border: 'none',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.45 : 1,
  };

  let palette;
  if (variant === 'ghost') {
    palette = {
      background: 'transparent',
      color: color.mint,
      border: `1px solid ${color.mint}`,
      padding: '6px 14px',
    };
  } else if (variant === 'danger') {
    palette = {
      background: color.error,
      color: '#fff',
      border: 'none',
      padding: '8px 16px',
    };
  } else {
    palette = {
      background: color.mint,
      color: '#fff',
      border: 'none',
      padding: '8px 16px',
    };
  }

  return (
    <button
      className={className}
      style={{ ...base, ...palette, ...style }}
      onClick={onClick}
      disabled={isDisabled}
    >
      {loading ? 'Loading…' : children}
    </button>
  );
}