import React from 'react';

const AVATARS = {
  etudiant: { emoji: '🧑‍💻', label: 'Étudiant',   color: '#6c757d' },
  junior:   { emoji: '👨‍🔬', label: 'Junior Dev',  color: '#0d6efd' },
  senior:   { emoji: '🧙‍♂️', label: 'Senior Dev',  color: '#6f42c1' },
  expert:   { emoji: '🦸',  label: 'Expert',      color: '#ffc107' },
};

export default function Avatar({ type = 'etudiant', level = 1 }) {
  const avatar = AVATARS[type] || AVATARS.etudiant;
  return (
    <div className="avatar-container" style={{ borderColor: avatar.color }}>
      <div className="avatar-emoji">{avatar.emoji}</div>
      <div className="avatar-label" style={{ color: avatar.color }}>{avatar.label}</div>
      <div className="avatar-level">Niv. {level}</div>
    </div>
  );
}
