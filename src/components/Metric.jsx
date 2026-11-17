export default function Metric({ icon, value, label, sublabel, color: c }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid ' + color.mid,
      borderRadius: 12,
      padding: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: c || color.mint }}>{value}</div>
        <div style={{ fontSize: 11, color: color.text2, marginTop: 2 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 10, color: color.text2 }}>{sublabel}</div>}
      </div>
    </div>
  );
}
