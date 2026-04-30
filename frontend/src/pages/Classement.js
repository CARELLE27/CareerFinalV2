import React, { useState, useEffect } from 'react';
import { getClassement, getClassementFiliere, getFilieres } from '../services/api';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Classement() {
  const [classement, setClassement] = useState([]);
  const [filieres, setFilieres]     = useState([]);
  const [filtre, setFiltre]         = useState('tous');

  useEffect(() => {
    getFilieres().then(r => setFilieres(r.data)).catch(() => {});
    charger('tous');
  }, []);

  const charger = async (f) => {
    try {
      const res = f === 'tous'
        ? await getClassement()
        : await getClassementFiliere(f);
      setClassement(res.data);
    } catch {}
  };

  const handleFiltre = (f) => {
    setFiltre(f);
    charger(f);
  };

  return (
    <div className="page">
      <h1>🏆 Classement</h1>

      {/* Filtres filière */}
      <div className="filtres" style={{ marginBottom: '20px' }}>
        <button
          className={`filtre-btn ${filtre === 'tous' ? 'active' : ''}`}
          onClick={() => handleFiltre('tous')}
        >
          🌍 Tous
        </button>
        {filieres.map(f => (
          <button
            key={f.value}
            className={`filtre-btn ${filtre === f.value ? 'active' : ''}`}
            onClick={() => handleFiltre(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="classement-list">
        {classement.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
            Aucun utilisateur dans cette filière pour l'instant.
          </div>
        )}
        {classement.map((user, i) => (
          <div key={i} className={`classement-item rang-${user.rang}`}>
            <span className="rang">{MEDALS[i] || `#${user.rang}`}</span>
            <div className="user-info">
              <strong>{user.username}</strong>
              <div style={{ display: 'flex', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                <span className="level-tag">Niv. {user.level}</span>
                {user.ecole && (
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8' }}>🏫 {user.ecole}</span>
                )}
                <span style={{ fontSize: '0.7rem', color: '#a78bfa' }}>{user.filiere_label}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="points-total">{user.points} XP</div>
              <div style={{ fontSize: '0.72rem', color: '#888' }}>
                {user.quetes_completees} quêtes
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
