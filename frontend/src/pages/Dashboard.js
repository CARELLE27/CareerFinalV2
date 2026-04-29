import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfil, getMesQuetes } from '../services/api';
import Avatar from '../components/Avatar';
import ProgressBar from '../components/ProgressBar';

export default function Dashboard() {
  const [user, setUser]     = useState(null);
  const [quetes, setQuetes] = useState([]);
  const navigate            = useNavigate();

  useEffect(() => {
    getProfil().then(r => setUser(r.data)).catch(() => {});
    getMesQuetes().then(r => setQuetes(r.data)).catch(() => {});
  }, []);

  if (!user) return <div className="loading">Chargement...</div>;

  const validees    = quetes.filter(q => q.statut === 'valide');
  const enAttente   = quetes.filter(q => q.statut === 'soumis');
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
            {/* Chaque stat est cliquable et redirige vers la bonne page */}
            <div className="stat clickable" onClick={() => navigate('/profil')} title="Voir mon profil">
              <span className="stat-value">{user.points}</span>
              <span className="stat-label">XP Total</span>
            </div>
            <div className="stat clickable" onClick={() => navigate('/quetes')} title="Voir mes quêtes">
              <span className="stat-value">{validees.length}</span>
              <span className="stat-label">Quêtes validées</span>
            </div>
            <div className="stat clickable" onClick={() => navigate('/quetes')} title="Voir en attente">
              <span className="stat-value">{enAttente.length}</span>
              <span className="stat-label">En attente</span>
            </div>
            <div className="stat clickable" onClick={() => navigate('/classement')} title="Voir le classement">
              <span className="stat-value">{user.level}</span>
              <span className="stat-label">Niveau</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-quetes">
        <div className="dashboard-quetes-header">
          <h2>🗡️ Dernières quêtes</h2>
          {/* Bouton "Voir toutes" */}
          <button className="btn-voir-toutes" onClick={() => navigate('/quetes')}>
            Voir toutes →
          </button>
        </div>
        <div className="quetes-grid">
          {quetes.slice(0, 4).map(uq => (
            <div
              key={uq.id}
              className={`quete-card ${uq.statut === 'valide' ? 'done' : ''}`}
              onClick={() => navigate('/quetes')}
              style={{ cursor: 'pointer' }}
              title="Aller sur la page Quêtes"
            >
              <span className="quete-icone">{uq.quete.icone}</span>
              <span className="quete-titre">{uq.quete.titre}</span>
              <span className="quete-points">+{uq.quete.points} XP</span>
              {uq.statut === 'valide' && <span>✅</span>}
              {uq.statut === 'soumis' && <span>⏳</span>}
              {uq.statut === 'refuse' && <span>❌</span>}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .stat.clickable {
          cursor: pointer;
          transition: all 0.2s;
        }
        .stat.clickable:hover {
          background: rgba(111,66,193,0.4);
          transform: translateY(-2px);
        }
        .dashboard-quetes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .btn-voir-toutes {
          background: transparent;
          border: 1px solid #6f42c1;
          color: #a78bfa;
          padding: 5px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.82rem;
          transition: all 0.2s;
        }
        .btn-voir-toutes:hover {
          background: #6f42c1;
          color: white;
        }
        .quete-card {
          transition: all 0.2s;
        }
        .quete-card:hover {
          border-color: #6f42c1 !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}