import React from 'react';
import { focusStatus, color } from '../lib/tokens.js';

export default function StudentTile({ studentId, name, vitals, lastUpdated, onOpenVerification }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const { key: statusKey, color: statusColor, label: status } = focusStatus(vitals, lastUpdated);

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
          <span className={`status-pill ${statusKey}`}>{status}</span>
        </div>
      </div>

      <div className="tile-focus">
        <span className="focus-big" style={{ color: statusColor }}>{focusPct}%</span>
        <svg className="sparkline" viewBox="0 0 100 24" fill="none">
          <polyline points={points} stroke={color.brand.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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