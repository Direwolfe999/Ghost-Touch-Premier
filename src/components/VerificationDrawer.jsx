import { color } from '../lib/tokens';

export default function VerificationDrawer({ student, onClose }) {
  const v = student.vitals || {};
  const rows = [
    ['Pulse', v.pulse ? `${v.pulse} bpm` : '—'],
    ['Breathing', v.breathingRate ? `${v.breathingRate}/min` : '—'],
    ['Blink rate', v.blinkRate ? `${v.blinkRate}/min` : '—'],
    ['Talking', v.talking ? 'Yes' : 'No'],
    ['Expression', v.facialExpression || '—'],
    ['Focus score', v.focusScore != null ? `${Math.round(v.focusScore * 100)}%` : '—'],
    ['Face detected', v.faceDetected ? 'Yes' : 'No'],
    ['Last update', new Date(student.lastUpdated).toLocaleTimeString()],
  ];

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90,
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
        background: color.card,
        borderLeft: '1.5px solid rgba(255,255,255,0.12)',
        padding: 24, zIndex: 91, overflow: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Verification</div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: color.text2,
            fontSize: 20, cursor: 'pointer',
          }}>×</button>
        </div>

        <div style={{ fontSize: 13, color: color.mint, marginBottom: 16 }}>
          {student.name || student.id.slice(0, 6)}
        </div>

        <div style={{ marginBottom: 20 }}>
          {rows.map(([k, val]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '6px 0',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              fontSize: 12,
            }}>
              <span style={{ color: color.text2 }}>{k}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{val}</span>
            </div>
          ))}
        </div>

        <div style={{
          padding: 12,
          background: 'rgba(0,122,255,0.10)',
          border: '1px solid rgba(0,122,255,0.25)',
          borderRadius: 12,
          fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
          color: color.blue, marginBottom: 12, lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}>
          focusScore = 0.4·eyeOpenness
          + 0.3·headStability
          + 0.3·expressionValence
        </div>

        <div style={{ fontSize: 11, color: color.text2, lineHeight: 1.5 }}>
          This student consented to camera-based physiological sensing for this session.
          No video is recorded or transmitted.
        </div>
      </div>
    </>
  );
}
