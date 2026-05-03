import React from 'react';

/**
 * Composant QuestePath — affiche les quêtes sous forme de chemin RPG
 * Props :
 *   quetes : array — liste des UserQuete avec statut
 */
export default function QuestePath({ quetes }) {
  if (!quetes || quetes.length === 0) return null;

  const STATUT_CONFIG = {
    valide:       { bg: '#16a34a', border: '#4ade80', icon: '✅', glow: 'rgba(74,222,128,0.3)' },
    soumis:       { bg: '#ca8a04', border: '#fde047', icon: '⏳', glow: 'rgba(253,224,71,0.3)' },
    refuse:       { bg: '#dc2626', border: '#f87171', icon: '❌', glow: 'rgba(248,113,113,0.2)' },
    non_commence: { bg: '#2a1a5e', border: '#444',    icon: '🔒', glow: 'none' },
    en_cours:     { bg: '#1d4ed8', border: '#60a5fa', icon: '🔄', glow: 'rgba(96,165,250,0.2)' },
  };

  const nb_valides = quetes.filter(q => q.statut === 'valide').length;
  const progression = Math.round((nb_valides / quetes.length) * 100);

  return (
    <div className="questepath-wrap">
      {/* Barre de progression globale */}
      <div className="questepath-progress">
        <div className="questepath-progress-label">
          🗺️ Progression du parcours : <strong>{nb_valides}/{quetes.length} quêtes</strong> — {progression}%
        </div>
        <div className="questepath-bar-bg">
          <div className="questepath-bar-fill" style={{ width: `${progression}%` }} />
        </div>
      </div>

      {/* Chemin avec étapes */}
      <div className="questepath-road">
        {/* Départ */}
        <div className="questepath-start">
          🏁 <span>Départ</span>
        </div>

        {/* Étapes sur le chemin */}
        <div className="questepath-steps">
          {quetes.map((uq, i) => {
            const cfg = STATUT_CONFIG[uq.statut] || STATUT_CONFIG.non_commence;
            const isLeft = i % 2 === 0;
            return (
              <div key={uq.id} className={`questepath-step ${isLeft ? 'left' : 'right'}`}>
                {/* Ligne du chemin */}
                {i < quetes.length - 1 && (
                  <div className={`questepath-connector ${uq.statut === 'valide' ? 'done' : ''}`} />
                )}

                {/* Nœud */}
                <div
                  className="questepath-node"
                  style={{
                    background: cfg.bg,
                    borderColor: cfg.border,
                    boxShadow: `0 0 12px ${cfg.glow}`,
                  }}
                  title={uq.quete.titre}
                >
                  <span className="questepath-node-icon">{uq.quete.icone}</span>
                  <span className="questepath-node-status">{cfg.icon}</span>
                </div>

                {/* Carte info */}
                <div className={`questepath-card ${isLeft ? 'card-left' : 'card-right'}`}>
                  <div className="questepath-card-title">{uq.quete.titre}</div>
                  <div className="questepath-card-meta">
                    <span>+{uq.quete.points} XP</span>
                    <span className="questepath-card-status" style={{ color: cfg.border }}>
                      {cfg.icon} {uq.statut.replace('_', ' ')}
                    </span>
                  </div>
                  {uq.points_gagnes > 0 && (
                    <div className="questepath-xp-earned">+{uq.points_gagnes} XP gagnés !</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrivée */}
        <div className={`questepath-end ${nb_valides === quetes.length ? 'reached' : ''}`}>
          {nb_valides === quetes.length ? '🏆 Parcours complété !' : '🏆 Objectif final'}
        </div>
      </div>

      <style>{`
        .questepath-wrap {
          margin-top: 8px;
        }

        /* Barre de progression */
        .questepath-progress { margin-bottom: 20px; }
        .questepath-progress-label { font-size: 0.82rem; color: #a78bfa; margin-bottom: 6px; }
        .questepath-bar-bg {
          background: #1a1a2e; border-radius: 6px; height: 10px; overflow: hidden;
          border: 1px solid #2a1a5e;
        }
        .questepath-bar-fill {
          background: linear-gradient(90deg, #7c3aed, #4ade80);
          height: 100%; border-radius: 6px;
          transition: width 0.6s ease;
        }

        /* Route */
        .questepath-road {
          position: relative;
          padding: 10px 0;
        }

        /* Départ et Arrivée */
        .questepath-start, .questepath-end {
          text-align: center;
          font-size: 0.9rem;
          font-weight: 700;
          color: #a78bfa;
          padding: 10px;
          background: rgba(111,66,193,0.1);
          border: 1px solid #6f42c1;
          border-radius: 10px;
          margin: 0 80px;
        }
        .questepath-end.reached {
          color: #fde047;
          background: rgba(253,224,71,0.1);
          border-color: #fde047;
          animation: pulse 1s ease infinite alternate;
        }

        /* Étapes */
        .questepath-steps {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 0;
          gap: 0;
        }

        .questepath-step {
          display: flex;
          align-items: center;
          width: 100%;
          position: relative;
          margin: 12px 0;
          justify-content: center;
        }
        .questepath-step.left  { flex-direction: row; }
        .questepath-step.right { flex-direction: row-reverse; }

        /* Connecteur vertical */
        .questepath-connector {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 3px;
          height: 24px;
          background: #2a1a5e;
          z-index: 0;
        }
        .questepath-connector.done { background: #4ade80; }

        /* Nœud */
        .questepath-node {
          width: 56px; height: 56px;
          border-radius: 50%;
          border: 2px solid;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          flex-shrink: 0;
          z-index: 1;
          cursor: default;
          transition: transform 0.2s;
          position: relative;
        }
        .questepath-node:hover { transform: scale(1.1); }
        .questepath-node-icon  { font-size: 1.2rem; line-height: 1; }
        .questepath-node-status {
          font-size: 0.65rem;
          position: absolute;
          bottom: -2px; right: -2px;
          background: #07071a;
          border-radius: 50%;
          width: 18px; height: 18px;
          display: flex; align-items: center; justify-content: center;
        }

        /* Carte info */
        .questepath-card {
          background: #1a1a2e;
          border: 1px solid #2a1a5e;
          border-radius: 8px;
          padding: 8px 12px;
          max-width: 200px;
          margin: 0 12px;
          transition: border-color 0.2s;
        }
        .questepath-card:hover { border-color: #6f42c1; }
        .questepath-card-title {
          font-size: 0.78rem; font-weight: 700;
          color: #e0e0f0; margin-bottom: 4px; line-height: 1.3;
        }
        .questepath-card-meta {
          display: flex; gap: 8px; flex-wrap: wrap;
          font-size: 0.7rem; color: #888;
        }
        .questepath-card-status { font-weight: 700; }
        .questepath-xp-earned {
          font-size: 0.7rem; color: #fde047;
          margin-top: 3px; font-weight: 700;
        }

        @keyframes pulse {
          from { box-shadow: 0 0 8px rgba(253,224,71,0.3); }
          to   { box-shadow: 0 0 20px rgba(253,224,71,0.6); }
        }

        @media (max-width: 600px) {
          .questepath-card { max-width: 140px; }
          .questepath-node { width: 44px; height: 44px; }
          .questepath-node-icon { font-size: 1rem; }
        }
      `}</style>
    </div>
  );
}
