import { color } from '../lib/tokens';

export default function Input({
  icon,
  value,
  onChange,
  onKeyDown,
  placeholder,
  type = 'text',
  autoFocus,
  maxLength,
  style,
  ...rest
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: color.card,
        border: `1.5px solid ${color.border}`,
        borderRadius: 12,
        padding: '0 12px',
        transition: 'border-color 150ms ease',
        ...style,
      }}
    >
      {icon && (
        <span style={{ color: color.mint, fontSize: 14, flexShrink: 0 }}>{icon}</span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={maxLength}
        style={{
          flex: 1,
          minWidth: 0,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#fff',
          fontFamily: 'inherit',
          fontSize: 14,
          padding: '12px 0',
        }}
        {...rest}
      />
    </div>
  );
}