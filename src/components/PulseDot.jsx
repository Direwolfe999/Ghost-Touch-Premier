export default function PulseDot({ color: c, pulsing = false, size = 8 }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: c,
        boxShadow: pulsing ? `0 0 0 6px ${c}40, 0 0 12px ${c}` : 'none',
        animation: pulsing ? 'pulse 2s infinite' : 'none',
      }}
    />
  );
}
