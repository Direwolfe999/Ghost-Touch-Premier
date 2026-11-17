import { color } from '../lib/tokens';

export default function Card({ children, className, style }) {
  return (
    <div
      className={className}
      style={{
        background: color.card,
        border: '1px solid ' + color.border,
        borderRadius: 14,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
