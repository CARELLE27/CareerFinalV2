import React, { useState, useEffect } from 'react';
import { getClassement } from '../services/api';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Classement() {
  const [classement, setClassement] = useState([]);

  useEffect(() => {
    getClassement().then(r => setClassement(r.data)).catch(() => {});
  }, []);

  return (
    <div className="page">
      <h1>🏆 Classement</h1>
      <div className="classement-list">
        {classement.map((user, i) => (
          <div key={i} className={`classement-item rang-${user.rang}`}>
            <span className="rang">{MEDALS[i] || `#${user.rang}`}</span>
            <div className="user-info">
              <strong>{user.username}</strong>
              <span className="level-tag">Niv. {user.level}</span>
            </div>
            <div style={{textAlign:'right'}}>
              <div className="points-total">{user.points} XP</div>
              <div style={{fontSize:'0.75rem',color:'#aaa'}}>{user.quetes_completees} quêtes</div>
            </div>
          </div>
        ))}
        {classement.length === 0 && (
          <p style={{color:'#aaa', textAlign:'center', marginTop:'40px'}}>
            Aucun joueur pour l'instant. Soyez le premier ! 🚀
          </p>
        )}
      </div>
    </div>
  );
}
