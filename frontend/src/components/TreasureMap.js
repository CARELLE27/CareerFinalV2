import React, { useState } from 'react';

const CAT_CONFIG = {
  informatique:        { label: '💻 Informatique',       color: '#7c3aed', light: '#a78bfa', bg: '#1a0a3e' },
  mathematiques:       { label: '📐 Mathématiques',      color: '#0ea5e9', light: '#38bdf8', bg: '#0a1828' },
  sciences_physiques:  { label: '⚗️ Sciences Phys.',    color: '#f59e0b', light: '#fcd34d', bg: '#1e1200' },
  litterature:         { label: '📚 Littérature',        color: '#ec4899', light: '#f9a8d4', bg: '#280a18' },
  langues:             { label: '🌍 Langues',             color: '#10b981', light: '#6ee7b7', bg: '#002818' },
  sante:               { label: '🏥 Santé',               color: '#ef4444', light: '#fca5a5', bg: '#280808' },
  sciences_naturelles: { label: '🌿 Sc. Naturelles',     color: '#22c55e', light: '#86efac', bg: '#002810' },
  culture_generale:    { label: '🎓 Culture Générale',   color: '#f97316', light: '#fdba74', bg: '#1e0e00' },
  autre:               { label: '🎯 Autre',               color: '#8b5cf6', light: '#c4b5fd', bg: '#160a28' },
};

const STATUT_CFG = {
  valide:       { icon: '✅', color: '#4ade80', pulse: true  },
  soumis:       { icon: '⏳', color: '#fde047', pulse: false },
  refuse:       { icon: '❌', color: '#f87171', pulse: false },
  en_cours:     { icon: '🔄', color: '#60a5fa', pulse: false },
  non_commence: { icon: '✕',  color: '#444',    pulse: false },
};

export default function TreasureMap({ quetes }) {
  const [tooltip, setTooltip] = useState(null);

  if (!quetes || !quetes.length) return (
    <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Aucune quête disponible</div>
  );

  const nb_valides = quetes.filter(q => q.statut === 'valide').length;
  const pct = Math.round((nb_valides / quetes.length) * 100);

  // Prochaine quête à faire
  const prochaine = quetes.find(q => q.statut === 'non_commence' || q.statut === 'refuse');

  // Grouper par catégorie
  const groupes = {};
  quetes.forEach(uq => {
    const cat = (uq.quete.filieres_cibles || [])[0] || 'autre';
    if (!groupes[cat]) groupes[cat] = [];
    groupes[cat].push(uq);
  });

  const cats = Object.keys(groupes);

  // Layout : 3 colonnes, continents en grille
  const COLS       = 3;
  const CONT_W     = 280;
  const ISLE_R     = 22;
  const ISLE_COLS  = 4;
  const ISLE_GAP   = 56;
  const PAD        = 14;
  const HEADER_H   = 32;

  // Calculer hauteur de chaque continent
  function contHeight(nbQuetes) {
    const rows = Math.ceil(nbQuetes / ISLE_COLS);
    return HEADER_H + PAD + rows * ISLE_GAP + PAD;
  }

  // Calculer positions des continents
  const CONT_GAP = 24;
  const contPositions = cats.map((cat, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    // hauteur max dans la même rangée
    const sameRow = cats.filter((_, j) => Math.floor(j / COLS) === row);
    let yOffset = 0;
    for (let r = 0; r < row; r++) {
      const rowCats = cats.filter((_, j) => Math.floor(j / COLS) === r);
      yOffset += Math.max(...rowCats.map(c => contHeight(groupes[c].length))) + CONT_GAP;
    }
    return {
      cat,
      x: col * (CONT_W + CONT_GAP) + CONT_GAP,
      y: yOffset + CONT_GAP,
      w: CONT_W,
      h: contHeight(groupes[cat].length),
    };
  });

  // Total SVG height
  const totalH = Math.max(...contPositions.map(p => p.y + p.h)) + CONT_GAP + 60;
  const totalW = COLS * (CONT_W + CONT_GAP) + CONT_GAP;

  // Positions îles dans un continent
  function islePos(cx, cy, i) {
    const col = i % ISLE_COLS;
    const row = Math.floor(i / ISLE_COLS);
    return {
      x: cx + PAD + col * ISLE_GAP + ISLE_R,
      y: cy + HEADER_H + PAD + row * ISLE_GAP + ISLE_R,
    };
  }

  // Chemins entre continents (centre à centre)
  const pathLines = contPositions.slice(0, -1).map((a, i) => {
    const b = contPositions[i + 1];
    return {
      x1: a.x + a.w / 2, y1: a.y + a.h / 2,
      x2: b.x + b.w / 2, y2: b.y + b.h / 2,
    };
  });

  return (
    <div className="tm-outer">
      {/* Barre de progression */}
      <div className="tm-top">
        <span className="tm-title">🗺️ Carte du Monde CareerQuest</span>
        <div className="tm-prog-row">
          <div className="tm-prog-bg">
            <div className="tm-prog-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="tm-prog-label">{nb_valides}/{quetes.length} • {pct}%</span>
        </div>
        <div className="tm-legend">
          <span>✅ Validée</span>
          <span style={{color:'#fde047'}}>✈️ Prochaine</span>
          <span>⏳ En attente</span>
          <span style={{opacity:0.5}}>✕ Non commencée</span>
        </div>
      </div>

      {/* Carte scrollable */}
      <div className="tm-scroll">
        <svg
          viewBox={`0 0 ${totalW} ${totalH}`}
          width={totalW}
          height={totalH}
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', minWidth: totalW }}
        >
          <defs>
            <radialGradient id="ocean2" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0d1528" />
              <stop offset="100%" stopColor="#070c18" />
            </radialGradient>
            <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Fond océan */}
          <rect width={totalW} height={totalH} fill="url(#ocean2)" rx="12" />

          {/* Grille */}
          {[...Array(20)].map((_, i) => (
            <line key={`vg${i}`} x1={i*50} y1={0} x2={i*50} y2={totalH}
              stroke="#ffffff06" strokeWidth="1" />
          ))}
          {[...Array(20)].map((_, i) => (
            <line key={`hg${i}`} x1={0} y1={i*50} x2={totalW} y2={i*50}
              stroke="#ffffff06" strokeWidth="1" />
          ))}

          {/* Chemins entre continents */}
          {pathLines.map((p, i) => (
            <line key={`path${i}`}
              x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
              stroke="#ffffff12" strokeWidth="1.5"
              strokeDasharray="6,5"
            />
          ))}

          {/* Continents */}
          {contPositions.map(({ cat, x, y, w, h }) => {
            const cfg  = CAT_CONFIG[cat] || CAT_CONFIG.autre;
            const uqs  = groupes[cat];

            return (
              <g key={cat}>
                {/* Fond continent */}
                <rect x={x} y={y} width={w} height={h}
                  rx="14" fill={cfg.bg}
                  stroke={cfg.color} strokeWidth="1.5" opacity="0.95"
                />

                {/* Label continent */}
                <text x={x + w / 2} y={y + 20}
                  textAnchor="middle"
                  fill={cfg.light}
                  fontSize="11" fontWeight="bold" fontFamily="Arial"
                >
                  {cfg.label}
                </text>

                {/* Séparateur */}
                <line x1={x + 12} y1={y + 26} x2={x + w - 12} y2={y + 26}
                  stroke={cfg.color} strokeWidth="0.6" opacity="0.4"
                />

                {/* Îles (quêtes) */}
                {uqs.map((uq, i) => {
                  const { x: ix, y: iy } = islePos(x, y, i);
                  const estProchaine = prochaine?.id === uq.id;
                  const cfg2  = STATUT_CFG[uq.statut] || STATUT_CFG.non_commence;
                  const done  = uq.statut === 'valide';
                  const color = estProchaine ? '#fde047' : cfg2.color;
                  const r     = done ? 20 : estProchaine ? 19 : 17;

                  return (
                    <g key={uq.id}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setTooltip({ ix, iy, uq, estProchaine })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      {/* Anneau pulsé prochaine */}
                      {estProchaine && (
                        <circle cx={ix} cy={iy} r={r + 6}
                          fill="none" stroke="#fde047" strokeWidth="1.5" opacity="0.3"
                        >
                          <animate attributeName="r" values={`${r+4};${r+10};${r+4}`} dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}

                      {/* Cercle île */}
                      <circle cx={ix} cy={iy} r={r}
                        fill={done ? 'rgba(22,163,74,0.25)' : estProchaine ? 'rgba(253,224,71,0.15)' : 'rgba(0,0,0,0.35)'}
                        stroke={color}
                        strokeWidth={estProchaine || done ? 2 : 1.2}
                        filter={done || estProchaine ? 'url(#glow2)' : undefined}
                      />

                      {/* Icône quête */}
                      <text x={ix} y={iy - 3}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={done ? 13 : 11}
                      >
                        {estProchaine ? '✈️' : uq.quete.icone}
                      </text>

                      {/* Statut */}
                      <text x={ix} y={iy + 11}
                        textAnchor="middle"
                        fontSize="8" fill={color}
                        fontFamily="Arial" fontWeight="bold"
                      >
                        {done ? '✓' : estProchaine ? '' : cfg2.icon}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Trésor */}
          <g>
            <circle
              cx={totalW - 36} cy={totalH - 36} r={22}
              fill={nb_valides === quetes.length ? 'rgba(253,224,71,0.2)' : 'rgba(0,0,0,0.4)'}
              stroke={nb_valides === quetes.length ? '#fde047' : '#444'}
              strokeWidth="2"
              filter={nb_valides === quetes.length ? 'url(#glow2)' : undefined}
            />
            <text x={totalW - 36} y={totalH - 42}
              textAnchor="middle" fontSize="16">🏆</text>
            <text x={totalW - 36} y={totalH - 22}
              textAnchor="middle" fontSize="7"
              fill={nb_valides === quetes.length ? '#fde047' : '#555'}
              fontFamily="Arial" fontWeight="bold"
            >
              {nb_valides === quetes.length ? 'TRÉSOR!' : 'Objectif'}
            </text>
          </g>

          {/* Rose des vents */}
          <text x="18" y={totalH - 18} fontSize="8" fill="#444" fontFamily="Arial">🧭</text>

          {/* Tooltip */}
          {tooltip && (() => {
            const { ix, iy, uq, estProchaine } = tooltip;
            const tw = 160;
            const th = 60;
            const tx = Math.min(ix - tw / 2, totalW - tw - 8);
            const ty = iy - th - 14 < 0 ? iy + 24 : iy - th - 14;
            const cfg2 = STATUT_CFG[uq.statut] || STATUT_CFG.non_commence;
            return (
              <g>
                <rect x={tx} y={ty} width={tw} height={th}
                  rx="8" fill="#0d0d2b" stroke="#6f42c1" strokeWidth="1.5" />
                <text x={tx + tw / 2} y={ty + 16}
                  textAnchor="middle" fill="#e0e0f0"
                  fontSize="9" fontWeight="bold" fontFamily="Arial">
                  {uq.quete.icone} {uq.quete.titre.length > 24
                    ? uq.quete.titre.slice(0, 24) + '…'
                    : uq.quete.titre}
                </text>
                <text x={tx + tw / 2} y={ty + 32}
                  textAnchor="middle" fill="#a78bfa"
                  fontSize="8" fontFamily="Arial">
                  +{uq.quete.points} XP
                </text>
                <text x={tx + tw / 2} y={ty + 48}
                  textAnchor="middle"
                  fill={estProchaine ? '#fde047' : cfg2.color}
                  fontSize="8" fontFamily="Arial" fontWeight="bold">
                  {estProchaine ? '✈️ Prochaine étape !' : uq.statut.replace('_', ' ')}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      <style>{`
        .tm-outer { }
        .tm-top { margin-bottom: 12px; }
        .tm-title { font-size: 0.95rem; font-weight: 700; color: #fde047; display: block; margin-bottom: 8px; }
        .tm-prog-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .tm-prog-bg { flex: 1; background: #1a1a2e; border-radius: 6px; height: 8px; overflow: hidden; }
        .tm-prog-fill { background: linear-gradient(90deg, #7c3aed, #4ade80); height: 100%; border-radius: 6px; transition: width 0.5s ease; }
        .tm-prog-label { font-size: 0.75rem; color: #a78bfa; white-space: nowrap; }
        .tm-legend { display: flex; gap: 14px; font-size: 0.72rem; color: #888; flex-wrap: wrap; }

        /* Zone scrollable horizontalement et verticalement */
        .tm-scroll {
          overflow: auto;
          border: 2px solid #2a1a5e;
          border-radius: 12px;
          background: #070c18;
          max-height: 520px;
        }
        .tm-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .tm-scroll::-webkit-scrollbar-track { background: #0d0d2b; }
        .tm-scroll::-webkit-scrollbar-thumb { background: #6f42c1; border-radius: 4px; }
      `}</style>
    </div>
  );
}