import React, { useState } from 'react';

/**
 * TreasureMap — Carte au trésor interactive
 * Chaque "continent" = une catégorie de compétences
 * Chaque "île" = une quête
 * ✈️ = prochaine quête à faire
 * ✅ = validée
 * ❌ = refusée
 * 🔒 = non commencée
 * ⏳ = en attente
 */

const CATEGORY_CONFIG = {
  informatique:       { label: '💻 Informatique',       color: '#7c3aed', light: '#a78bfa', bg: '#1a0a3e', x: 60,  y: 80  },
  mathematiques:      { label: '📐 Mathématiques',      color: '#0ea5e9', light: '#38bdf8', bg: '#0a1a2e', x: 380, y: 60  },
  sciences_physiques: { label: '⚗️ Sciences Physiques', color: '#f59e0b', light: '#fcd34d', bg: '#2e1a00', x: 680, y: 100 },
  litterature:        { label: '📚 Littérature',        color: '#ec4899', light: '#f9a8d4', bg: '#2e0a1a', x: 120, y: 340 },
  langues:            { label: '🌍 Langues',             color: '#10b981', light: '#6ee7b7', bg: '#002e1a', x: 420, y: 320 },
  sante:              { label: '🏥 Santé',               color: '#ef4444', light: '#fca5a5', bg: '#2e0a0a', x: 700, y: 340 },
  sciences_naturelles:{ label: '🌿 Sc. Naturelles',     color: '#22c55e', light: '#86efac', bg: '#002e10', x: 240, y: 560 },
  culture_generale:   { label: '🎓 Culture Générale',   color: '#f97316', light: '#fdba74', bg: '#2e1000', x: 580, y: 540 },
  autre:              { label: '🎯 Autre',               color: '#8b5cf6', light: '#c4b5fd', bg: '#1a0a2e', x: 880, y: 220 },
};

export default function TreasureMap({ quetes }) {
  const [tooltip, setTooltip] = useState(null);

  if (!quetes || !quetes.length) {
    return <div className="tm2-empty">Aucune quête disponible</div>;
  }

  const nb_valides = quetes.filter(q => q.statut === 'valide').length;
  const pct = Math.round((nb_valides / quetes.length) * 100);

  // Grouper les quêtes par filière cible (première filière ou "autre")
  const groupes = {};
  quetes.forEach(uq => {
    const cats = uq.quete.filieres_cibles || [];
    const cat  = cats[0] || 'autre';
    if (!groupes[cat]) groupes[cat] = [];
    groupes[cat].push(uq);
  });

  // Calculer les positions des îles dans chaque continent
  function getIslandPos(catX, catY, index, total) {
    const cols  = Math.ceil(Math.sqrt(total));
    const col   = index % cols;
    const row   = Math.floor(index / cols);
    const spacing = 54;
    const offsetX = (col - (cols - 1) / 2) * spacing;
    const offsetY = (row - Math.floor(total / cols) / 2) * spacing + 30;
    return { x: catX + offsetX + 60, y: catY + offsetY + 30 };
  }

  // Trouver la prochaine quête à faire (premier non_commence ou refuse)
  const prochaineQuete = quetes.find(q =>
    q.statut === 'non_commence' || q.statut === 'refuse'
  );

  // Dessiner les chemins entre les continents
  const continentKeys = Object.keys(groupes).filter(k => CATEGORY_CONFIG[k]);
  const paths = [];
  for (let i = 0; i < continentKeys.length - 1; i++) {
    const a = CATEGORY_CONFIG[continentKeys[i]];
    const b = CATEGORY_CONFIG[continentKeys[i + 1]];
    if (a && b) {
      paths.push({ x1: a.x + 60, y1: a.y + 40, x2: b.x + 60, y2: b.y + 40 });
    }
  }

  const getStatusIcon = (statut, estProchaine) => {
    if (estProchaine) return '✈️';
    switch (statut) {
      case 'valide':       return '✅';
      case 'refuse':       return '❌';
      case 'soumis':       return '⏳';
      case 'en_cours':     return '🔄';
      case 'non_commence': return '❌';
      default:             return '🔒';
    }
  };

  const getStatusColor = (statut, estProchaine) => {
    if (estProchaine) return '#fde047';
    switch (statut) {
      case 'valide':  return '#4ade80';
      case 'refuse':  return '#f87171';
      case 'soumis':  return '#fde047';
      default:        return '#666';
    }
  };

  return (
    <div className="tm2-wrap">
      {/* En-tête */}
      <div className="tm2-header">
        <div className="tm2-title">🗺️ Carte du Monde — Votre Aventure CareerQuest</div>
        <div className="tm2-progress-row">
          <div className="tm2-bar-bg">
            <div className="tm2-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="tm2-pct">{nb_valides}/{quetes.length} quêtes • {pct}%</span>
        </div>
        <div className="tm2-legend">
          <span>✅ Validée</span>
          <span>✈️ Prochaine étape</span>
          <span>⏳ En attente</span>
          <span style={{ opacity: 0.6 }}>❌ Non acquise</span>
        </div>
      </div>

      {/* Carte SVG */}
      <div className="tm2-map-container">
        <svg
          viewBox="0 0 1000 680"
          xmlns="http://www.w3.org/2000/svg"
          className="tm2-svg"
        >
          {/* Fond océan */}
          <defs>
            <radialGradient id="ocean" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0a1628" />
              <stop offset="100%" stopColor="#050c18" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <rect width="1000" height="680" fill="url(#ocean)" rx="12" />

          {/* Grille de navigation */}
          {[...Array(10)].map((_, i) => (
            <line key={`v${i}`} x1={i * 100} y1="0" x2={i * 100} y2="680"
              stroke="#ffffff08" strokeWidth="1" strokeDasharray="4,8" />
          ))}
          {[...Array(7)].map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 100} x2="1000" y2={i * 100}
              stroke="#ffffff08" strokeWidth="1" strokeDasharray="4,8" />
          ))}

          {/* Chemins entre continents */}
          {paths.map((p, i) => (
            <g key={i}>
              <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
                stroke="#ffffff15" strokeWidth="1.5" strokeDasharray="6,4" />
            </g>
          ))}

          {/* Continents + îles */}
          {Object.entries(groupes).map(([cat, uqs]) => {
            const cfg = CATEGORY_CONFIG[cat];
            if (!cfg) return null;
            const cx = cfg.x;
            const cy = cfg.y;
            const w  = Math.max(140, uqs.length * 40 + 60);
            const h  = Math.max(100, Math.ceil(uqs.length / 3) * 54 + 50);

            return (
              <g key={cat}>
                {/* Continent (île principale) */}
                <rect x={cx} y={cy} width={w} height={h}
                  rx="16" ry="16"
                  fill={cfg.bg}
                  stroke={cfg.color}
                  strokeWidth="1.5"
                  opacity="0.9"
                />

                {/* Nom du continent */}
                <text x={cx + w / 2} y={cy + 18}
                  textAnchor="middle"
                  fill={cfg.light}
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="Arial"
                >
                  {cfg.label}
                </text>

                {/* Ligne séparatrice */}
                <line x1={cx + 10} y1={cy + 24} x2={cx + w - 10} y2={cy + 24}
                  stroke={cfg.color} strokeWidth="0.5" opacity="0.5" />

                {/* Îles (quêtes) */}
                {uqs.map((uq, i) => {
                  const pos  = getIslandPos(cx, cy, i, uqs.length);
                  const est  = prochaineQuete?.id === uq.id;
                  const icon = getStatusIcon(uq.statut, est);
                  const col  = getStatusColor(uq.statut, est);
                  const done = uq.statut === 'valide';

                  return (
                    <g key={uq.id}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={e => setTooltip({
                        x: pos.x, y: pos.y,
                        titre: uq.quete.titre,
                        statut: uq.statut,
                        points: uq.quete.points,
                        icone: uq.quete.icone,
                        est,
                      })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {/* Cercle île */}
                      <circle cx={pos.x} cy={pos.y} r={done ? 18 : (est ? 16 : 14)}
                        fill={done ? 'rgba(22,163,74,0.3)' : est ? 'rgba(253,224,71,0.2)' : 'rgba(0,0,0,0.4)'}
                        stroke={col}
                        strokeWidth={est ? 2.5 : 1.5}
                        filter={est || done ? 'url(#glow)' : undefined}
                      />

                      {/* Animation pulsation pour prochaine étape */}
                      {est && (
                        <circle cx={pos.x} cy={pos.y} r="22"
                          fill="none"
                          stroke="#fde047"
                          strokeWidth="1"
                          opacity="0.5"
                        >
                          <animate attributeName="r" values="16;24;16" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* Icône quête */}
                      <text x={pos.x} y={pos.y - 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={done ? "13" : "11"}
                      >
                        {uq.quete.icone}
                      </text>

                      {/* Statut en dessous */}
                      <text x={pos.x} y={pos.y + 12}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="9"
                      >
                        {icon}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Trésor final */}
          <g>
            <circle cx="940" cy="620" r="28"
              fill={nb_valides === quetes.length ? 'rgba(253,224,71,0.3)' : 'rgba(0,0,0,0.5)'}
              stroke={nb_valides === quetes.length ? '#fde047' : '#666'}
              strokeWidth="2"
              filter={nb_valides === quetes.length ? 'url(#glow)' : undefined}
            />
            <text x="940" y="615" textAnchor="middle" fontSize="18">🏆</text>
            <text x="940" y="635" textAnchor="middle" fontSize="8"
              fill={nb_valides === quetes.length ? '#fde047' : '#666'}
              fontFamily="Arial" fontWeight="bold">
              {nb_valides === quetes.length ? 'TRÉSOR!' : 'Objectif'}
            </text>
            {nb_valides === quetes.length && (
              <circle cx="940" cy="620" r="36" fill="none" stroke="#fde047" strokeWidth="1.5" opacity="0.4">
                <animate attributeName="r" values="28;42;28" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>

          {/* Rose des vents */}
          <g opacity="0.5">
            <text x="60" y="640" fontSize="10" fill="#888" fontFamily="Arial">N</text>
            <text x="60" y="660" fontSize="10" fill="#888" fontFamily="Arial">↑</text>
            <circle cx="70" cy="650" r="14" fill="none" stroke="#444" strokeWidth="1" />
          </g>

          {/* Tooltip */}
          {tooltip && (
            <g>
              <rect
                x={Math.min(tooltip.x - 80, 840)}
                y={tooltip.y - 80}
                width="160" height="68"
                rx="8" fill="#0d0d2b"
                stroke="#6f42c1" strokeWidth="1.5"
              />
              <text x={Math.min(tooltip.x - 80, 840) + 80} y={tooltip.y - 62}
                textAnchor="middle" fill="#e0e0f0" fontSize="10" fontWeight="bold" fontFamily="Arial">
                {tooltip.icone} {tooltip.titre.length > 22 ? tooltip.titre.slice(0, 22) + '…' : tooltip.titre}
              </text>
              <text x={Math.min(tooltip.x - 80, 840) + 80} y={tooltip.y - 46}
                textAnchor="middle" fill="#a78bfa" fontSize="9" fontFamily="Arial">
                +{tooltip.points} XP
              </text>
              <text x={Math.min(tooltip.x - 80, 840) + 80} y={tooltip.y - 30}
                textAnchor="middle"
                fill={tooltip.est ? '#fde047' : tooltip.statut === 'valide' ? '#4ade80' : '#888'}
                fontSize="9" fontFamily="Arial">
                {tooltip.est ? '✈️ Prochaine étape !' : tooltip.statut.replace('_', ' ')}
              </text>
            </g>
          )}
        </svg>
      </div>

      <style>{`
        .tm2-wrap { }
        .tm2-empty { text-align:center; color:#666; padding:40px; }
        .tm2-header { margin-bottom:12px; }
        .tm2-title { font-size:1rem; font-weight:700; color:#fde047; margin-bottom:8px; }
        .tm2-progress-row { display:flex; align-items:center; gap:10px; margin-bottom:8px; }
        .tm2-bar-bg { flex:1; background:#1a1a2e; border-radius:6px; height:8px; overflow:hidden; }
        .tm2-bar-fill { background:linear-gradient(90deg,#7c3aed,#4ade80); height:100%; border-radius:6px; transition:width 0.5s ease; }
        .tm2-pct { font-size:0.78rem; color:#a78bfa; white-space:nowrap; }
        .tm2-legend { display:flex; gap:16px; font-size:0.72rem; color:#888; flex-wrap:wrap; }
        .tm2-map-container {
          border: 2px solid #2a1a5e;
          border-radius: 14px;
          overflow: hidden;
          background: #050c18;
        }
        .tm2-svg {
          width: 100%;
          height: auto;
          display: block;
        }
      `}</style>
    </div>
  );
}
