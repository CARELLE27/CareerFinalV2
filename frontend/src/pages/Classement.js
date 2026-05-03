import React, { useState, useEffect } from 'react';
import { getClassement, getClassementFiliere, getFilieres } from '../services/api';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Classement() {
  const [classement, setClassement] = useState([]);
  const [filieres, setFilieres]     = useState([]);
  const [ecoles, setEcoles]         = useState([]);
  const [filtreType, setFiltreType] = useState('tous');   // 'tous' | 'filiere' | 'ecole'
  const [filtreVal, setFiltreVal]   = useState('');       // code filière ou nom école

  useEffect(() => {
    getFilieres().then(r => setFilieres(r.data)).catch(() => {});
    charger('tous', '');
  }, []);

  const charger = async (type, val) => {
    try {
      let res;
      if (type === 'filiere' && val) {
        res = await getClassementFiliere(val);
      } else {
        res = await getClassement();
      }
      let data = res.data;
      // Filtrer par école côté frontend
      if (type === 'ecole' && val) {
        data = data.filter(u => u.ecole === val);
      }
      setClassement(data);
      // Extraire les écoles uniques pour le sélecteur
      if (type === 'tous') {
        const uniqueEcoles = [...new Set(data.map(u => u.ecole).filter(Boolean))];
        setEcoles(uniqueEcoles);
      }
    } catch {}
  };

  const handleFiltreFiliere = (code) => {
    setFiltreType('filiere');
    setFiltreVal(code);
    charger('filiere', code);
  };

  const handleFiltreEcole = (nom) => {
    setFiltreType('ecole');
    setFiltreVal(nom);
    charger('ecole', nom);
  };

  const handleTous = () => {
    setFiltreType('tous');
    setFiltreVal('');
    charger('tous', '');
  };

  return (
    <div className="page">
      <h1>🏆 Classement</h1>

      {/* ── FILTRES PAR FILIÈRE ── */}
      <div className="classement-section-label">Par filière :</div>
      <div className="filtres" style={{ marginBottom: '10px' }}>
        <button
          className={`filtre-btn ${filtreType === 'tous' ? 'active' : ''}`}
          onClick={handleTous}
        >
          🌍 Tous
        </button>
        {filieres.map(f => (
          <button
            key={f.value}
            className={`filtre-btn ${filtreType === 'filiere' && filtreVal === f.value ? 'active' : ''}`}
            onClick={() => handleFiltreFiliere(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── FILTRES PAR ÉCOLE ── */}
      {ecoles.length > 0 && (
        <>
          <div className="classement-section-label">Par école :</div>
          <div className="filtres" style={{ marginBottom: '20px' }}>
            {ecoles.map(e => (
              <button
                key={e}
                className={`filtre-btn ecole-btn ${filtreType === 'ecole' && filtreVal === e ? 'active' : ''}`}
                onClick={() => handleFiltreEcole(e)}
              >
                🏫 {e}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── LISTE ── */}
      {classement.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
          Aucun utilisateur dans cette catégorie.
        </div>
      ) : (
        <div className="classement-list">
          {classement.map((user, i) => (
            <div key={i} className={`classement-item rang-${user.rang}`}>
              <span className="rang">{MEDALS[i] || `#${user.rang}`}</span>
              <div className="user-info">
                <strong>{user.username}</strong>
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="level-tag">Niv. {user.level}</span>
                  {user.ecole && (
                    <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>🏫 {user.ecole}</span>
                  )}
                  {(user.filieres_labels || []).map((f, j) => (
                    <span key={j} style={{ fontSize: '0.7rem', color: '#a78bfa', background: 'rgba(111,66,193,0.15)', padding: '2px 7px', borderRadius: '10px' }}>
                      {f}
                    </span>
                  ))}
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
      )}

      <style>{`
        .classement-section-label {
          font-size: 0.78rem;
          color: #a78bfa;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
          margin-top: 4px;
        }
        .filtre-btn.ecole-btn {
          border-color: #0ea5e9;
          color: #38bdf8;
        }
        .filtre-btn.ecole-btn:hover,
        .filtre-btn.ecole-btn.active {
          background: rgba(14,165,233,0.2);
          border-color: #0ea5e9;
        }
      `}</style>
    </div>
  );
}