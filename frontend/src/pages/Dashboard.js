import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfil, getMesQuetes } from '../services/api';
import Avatar from '../components/Avatar';
import ProgressBar from '../components/ProgressBar';

const AVATAR_LEVELS = [
  { type: 'etudiant', label: 'Étudiant',   minLevel: 1,  minXP: 0    },
  { type: 'junior',   label: 'Junior Dev',  minLevel: 6,  minXP: 500  },
  { type: 'senior',   label: 'Senior Dev',  minLevel: 16, minXP: 1500 },
  { type: 'expert',   label: 'Expert',      minLevel: 31, minXP: 3000 },
];

function getNextAvatar(points) {
  const next = AVATAR_LEVELS.find(a => a.minXP > points);
  return next || null;
}

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
  const xpProchainniveau = 100 - progression;
  const nextAvatar  = getNextAvatar(user.points);
  const xpProchainAvatar = nextAvatar ? nextAvatar.minXP - user.points : null;

  const quetesFiltrees = [
    ...quetes.filter(q => q.recommandee && q.statut !== 'valide'),
    ...quetes.filter(q => !q.recommandee && q.statut !== 'valide'),
    ...quetes.filter(q => q.statut === 'valide'),
  ].slice(0, 4);

  // Filières (peut être un tableau)
  const filieres = Array.isArray(user.filieres)
    ? user.filieres
    : (user.filiere_label ? [user.filiere_label] : []);

  return (
    <div className="dashboard">
      <div className="dashboard-hero">
        <Avatar type={user.avatar} level={user.level} />
        <div className="hero-info">
          <h1>Bienvenue, {user.username} ! ⚔️</h1>

         {/* ✅ École + Niveau + Avatar sur la même ligne */}
<div className="hero-level-row">
   <span className="avatar-title-badge">{
    user.avatar === 'etudiant' ? '🧑‍💻 Étudiant'
    : user.avatar === 'junior' ? '👨‍🔬 Junior Dev'
    : user.avatar === 'senior' ? '🧙‍♂️ Senior Dev'
    : '🦸 Expert'
  }</span>
  <p className="level-badge">Niveau {user.level}</p>
    {/* Filtres filière */}
  {filieres.map((f, i) => (
    <span key={i} className="hero-tag filiere">{f}</span>
  ))}
   {user.ecole && <span className="hero-tag ecole">🏫 {user.ecole}</span>}
</div>

          {/* Barre XP vers prochain niveau */}
          <ProgressBar
            value={progression}
            max={100}
            label={`${progression}/100 XP — encore ${xpProchainniveau} XP pour le niveau ${user.level + 1}`}
          />

          {/* XP restants pour le prochain avatar */}
          {xpProchainAvatar !== null && (
            <div className="next-avatar-info">
              🎯 Il vous reste <strong>{xpProchainAvatar} XP</strong> pour devenir{' '}
              <strong>{nextAvatar.label}</strong>
              {nextAvatar.type === 'junior'  && ' 👨‍🔬'}
              {nextAvatar.type === 'senior'  && ' 🧙‍♂️'}
              {nextAvatar.type === 'expert'  && ' 🦸'}
            </div>
          )}

          <div className="stats-row">
            <div className="stat clickable" onClick={() => navigate('/profil')}>
              <span className="stat-value">{user.points}</span>
              <span className="stat-label">XP Total</span>
            </div>
            <div className="stat clickable" onClick={() => navigate('/quetes')}>
              <span className="stat-value">{validees.length}</span>
              <span className="stat-label">Quêtes validées</span>
            </div>
            <div className="stat clickable" onClick={() => navigate('/quetes')}>
              <span className="stat-value">{enAttente.length}</span>
              <span className="stat-label">En attente</span>
            </div>
            <div className="stat clickable" onClick={() => navigate('/classement')}>
              <span className="stat-value">{user.level}</span>
              <span className="stat-label">Niveau</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-quetes">
        <div className="dashboard-quetes-header">
          <div>
            <h2>🗡️ Quêtes recommandées</h2>
            {filieres.length > 0 && (
              <p className="quetes-filiere-label">
                Pour : <strong>{filieres.join(', ')}</strong>
              </p>
            )}
          </div>
          <button className="btn-voir-toutes" onClick={() => navigate('/quetes')}>
            Voir toutes →
          </button>
        </div>
        <div className="quetes-grid">
          {quetesFiltrees.map(uq => (
            <div
              key={uq.id}
              className={`quete-card ${uq.statut === 'valide' ? 'done' : ''} ${uq.recommandee ? 'recommended' : ''}`}
              onClick={() => navigate('/quetes')}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {uq.recommandee && uq.statut !== 'valide' && (
                <span className="recommended-badge">⭐ Recommandée</span>
              )}
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
    
        .hero-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
        .hero-tag { padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
        .hero-tag.ecole   { background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid #0ea5e9; }
        .hero-tag.filiere { background: rgba(111,66,193,0.2); color: #a78bfa; border: 1px solid #6f42c1; }
         .hero-level-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}
        .avatar-title-badge {
          background: rgba(111,66,193,0.15);
          border: 1px solid #6f42c1;
          color: #a78bfa;
          padding: 3px 12px;
          border-radius: 20px;
          font-size: 0.82rem;
          font-weight: 700;
        }
        .next-avatar-info {
          background: rgba(253,224,71,0.08);
          border: 1px solid rgba(253,224,71,0.3);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.82rem;
          color: #fde047;
          margin: 8px 0;
        }
        .stat.clickable { cursor: pointer; transition: all 0.2s; }
        .stat.clickable:hover { background: rgba(111,66,193,0.4); transform: translateY(-2px); }
        .dashboard-quetes-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .quetes-filiere-label { font-size: 0.78rem; color: #888; margin-top: 2px; }
        .btn-voir-toutes { background: transparent; border: 1px solid #6f42c1; color: #a78bfa; padding: 5px 14px; border-radius: 8px; cursor: pointer; font-size: 0.82rem; transition: all 0.2s; white-space: nowrap; }
        .btn-voir-toutes:hover { background: #6f42c1; color: white; }
        .quete-card { transition: all 0.2s; }
        .quete-card:hover { border-color: #6f42c1 !important; transform: translateY(-2px); }
        .quete-card.recommended { border-color: #7c3aed !important; }
        .recommended-badge { position: absolute; top: -8px; right: 8px; background: #7c3aed; color: white; font-size: 0.65rem; padding: 2px 8px; border-radius: 8px; font-weight: 700; }
      `}</style>
    </div>
  );
}