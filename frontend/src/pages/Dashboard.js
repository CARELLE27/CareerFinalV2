import React, { useState, useEffect } from 'react';
import { getProfil, getMesQuetes } from '../services/api';
import Avatar from '../components/Avatar';
import ProgressBar from '../components/ProgressBar';

export default function Dashboard() {
  const [user, setUser]   = useState(null);
  const [quetes, setQuetes] = useState([]);

  useEffect(() => {
    getProfil().then(r => setUser(r.data)).catch(() => {});
    getMesQuetes().then(r => setQuetes(r.data)).catch(() => {});
  }, []);

  if (!user) return <div className="loading">Chargement...</div>;

  const validees   = quetes.filter(q => q.statut === 'valide');
  const enAttente  = quetes.filter(q => q.statut === 'soumis');
  const progression = user.points % 100;

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <Avatar type={user.avatar} level={user.level} />
        <div className="hero-info">
          <h1>Bienvenue, {user.username} ! ⚔️</h1>
          <p className="level-badge">Niveau {user.level}</p>
          <ProgressBar value={progression} max={100} label={`${progression}/100 XP pour le niveau suivant`} />
          <div className="stats-row">
            <div className="stat">
              <span className="stat-value">{user.points}</span>
              <span className="stat-label">XP Total</span>
            </div>
            <div className="stat">
              <span className="stat-value">{validees.length}</span>
              <span className="stat-label">Quêtes validées</span>
            </div>
            <div className="stat">
              <span className="stat-value">{enAttente.length}</span>
              <span className="stat-label">En attente</span>
            </div>
            <div className="stat">
              <span className="stat-value">{user.level}</span>
              <span className="stat-label">Niveau</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-quetes">
        <h2>🗡️ Dernières quêtes</h2>
        <div className="quetes-grid">
          {quetes.slice(0, 4).map(uq => (
            <div key={uq.id} className={`quete-card ${uq.statut === 'valide' ? 'done' : ''}`}>
              <span className="quete-icone">{uq.quete.icone}</span>
              <span className="quete-titre">{uq.quete.titre}</span>
              <span className="quete-points">+{uq.quete.points} XP</span>
              {uq.statut === 'valide'  && <span>✅</span>}
              {uq.statut === 'soumis'  && <span>⏳</span>}
              {uq.statut === 'refuse'  && <span>❌</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
