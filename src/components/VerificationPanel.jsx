import React from 'react';

export default function VerificationPanel({ studentName, vitals, onClose }) {
  const signals = [
    { label: 'Pulse', value: vitals?.pulse != null ? `${vitals.pulse} bpm` : '—' },
    { label: 'Breathing', value: vitals?.breathingRate != null ? `${vitals.breathingRate} /min` : '—' },
    { label: 'Blink rate', value: vitals?.blinkRate != null ? `${vitals.blinkRate} /min` : '—' },
    { label: 'Talking', value: vitals?.talking != null ? (vitals.talking ? 'Yes' : 'No') : '—' },
    { label: 'Expression', value: vitals?.facialExpression ?? '—' },
    { label: 'Focus score', value: vitals?.focusScore != null ? `${Math.round(vitals.focusScore * 100)}%` : '—' },
    { label: 'Face detected', value: vitals?.faceDetected != null ? (vitals.faceDetected ? 'Yes' : 'No') : '—' },
    { label: 'Last updated', value: vitals?.lastUpdated ? new Date(vitals.lastUpdated).toLocaleTimeString() : '—' },
  ];

  return (
    <div className="verification-overlay" onClick={onClose}>
      <div className="verification-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Verification · {studentName}</h2>
          <button className="drawer-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="drawer-body">
          <table className="signals-table">
            <tbody>
              {signals.map((s) => (
                <tr key={s.label}>
                  <td className="signal-label">{s.label}</td>
                  <td className="signal-value">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="formula-callout">
            <strong>Formula:</strong> focusScore = 0.4·eyeOpenness + 0.3·headStability + 0.3·expressionValence
          </div>

          <div className="consent-line">
            This student consented to camera-based physiological sensing for this session. No video is
            recorded or transmitted.
          </div>
        </div>
      </div>
    </div>
  );
}
