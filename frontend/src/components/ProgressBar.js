import React from 'react';

export default function ProgressBar({ value, max, label }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      {label && <p className="progress-label">{label}</p>}
    </div>
  );
}
