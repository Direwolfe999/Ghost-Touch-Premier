import React from 'react';

export default function StudentTile({ studentId, name, vitals, lastUpdated, onOpenVerification }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const now = Date.now();
  const stale = !vitals || now - lastUpdated > 10000;

  let status, statusColor;
  if (stale) {
    status = 'Waiting';
    statusColor = '#8888aa';
  } else if (!vitals.faceDetected) {
    status = 'Check camera';
    statusColor = '#f5a623';
  } else if (vitals.focusScore >= 0.7) {
    status = 'Engaged';
    statusColor = '#3ddc97';
  } else if (vitals.focusScore >= 0.4) {
    status = 'Cognitive load';
    statusColor = '#f5a623';
  } else {
    status = 'Disengaged';
    statusColor = '#ff5c7a';
  }

  const focusPct = vitals && vitals.focusScore != null ? Math.round(vitals.focusScore * 100) : 0;
  const samples = vitals && vitals._sparkline ? vitals._sparkline : [];

  const maxY = samples.length ? Math.max(...samples.map((s) => s.y)) : 100;
  const points = samples
    .map((s, i) => `${(i / Math.max(samples.length - 1, 1)) * 100},${100 - (s.y / Math.max(maxY, 1)) * 80}`)
    .join(' ');

  return (
    <div className="student-tile">
      <div className="tile-header">
        <div className="avatar">{initials}</div>
        <div className="tile-info">
          <div className="tile-name">{name}</div>
          <span className={`status-pill ${statusColor}`}>{status}</span>
        </div>
      </div>

      <div className="tile-focus">
        <span className="focus-big" style={{ color: statusColor }}>{focusPct}%</span>
        <svg className="sparkline" viewBox="0 0 100 24" fill="none">
          <polyline points={points} stroke="#7b5cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="tile-micro">
        <span>{vitals && vitals.pulse != null ? `Pulse ${vitals.pulse} bpm` : 'Pulse —'}</span>
        <span>{vitals && vitals.breathingRate != null ? `BR ${vitals.breathingRate}/min` : 'BR —'}</span>
        <span>{vitals && vitals.blinkRate != null ? `Blink ${vitals.blinkRate}/min` : 'Blink —'}</span>
        <span>{vitals && vitals.talking != null ? `Talking ${vitals.talking ? 'Yes' : 'No'}` : 'Talking —'}</span>
      </div>

      <button className="verify-btn" onClick={() => onOpenVerification(studentId)}>
        Verification
      </button>
    </div>
  );
}
