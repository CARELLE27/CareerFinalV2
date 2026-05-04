import React, { useState } from 'react';

export default function CompetenceUnlockedModal({
  competences, queteTitre, username, level, points, onClose
}) {
  const [copied, setCopied] = useState(null);

  if (!competences || competences.length === 0) return null;

  const handleShare = async (competence, index) => {
    // ✅ Message juste : progression vers la compétence, pas encore maîtrisée
    const texte = queteTitre
      ? `🎮 J'ai validé la quête "${queteTitre}" sur CareerQuest !\n\n+${points} XP gagnés — Je progresse vers la compétence "${competence}" 🚀\n\n#CareerQuest #${competence.replace(/[\s\/\-]/g, '')} #Formation #Dev`
      : `🎮 Je progresse vers la compétence "${competence}" sur CareerQuest ! Niveau ${level} 🚀\n\n#CareerQuest #${competence.replace(/[\s\/\-]/g, '')} #Formation`;

    try {
      await navigator.clipboard.writeText(texte);
      setCopied(index);
      setTimeout(() => setCopied(null), 4000);
    } catch {}

    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://careerquest.app')}`,
      '_blank', 'width=600,height=600,scrollbars=yes'
    );
  };

  const S = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
    box:     { background: 'linear-gradient(135deg, #1a1a2e, #2d1060)', border: '2px solid #7c3aed', borderRadius: '20px', padding: '36px 32px', maxWidth: '460px', width: '100%', textAlign: 'center', boxShadow: '0 0 60px rgba(124,58,237,0.4)' },
    trophy:  { fontSize: '4rem', marginBottom: '12px', display: 'block' },
    title:   { fontSize: '1.6rem', fontWeight: 700, color: '#fde047', marginBottom: '8px' },
    queteLabel: { fontSize: '0.85rem', color: '#a78bfa', marginBottom: '8px', background: 'rgba(111,66,193,0.15)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #6f42c1' },
    sub:     { fontSize: '0.9rem', color: '#a78bfa', marginBottom: '16px' },
    comps:   { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '12px' },
    badge:   { background: 'rgba(124,58,237,0.3)', border: '2px solid #7c3aed', color: '#a78bfa', padding: '8px 18px', borderRadius: '20px', fontSize: '0.95rem', fontWeight: 700 },
    progressMsg: { fontSize: '0.82rem', color: '#fde047', marginBottom: '12px', background: 'rgba(253,224,71,0.08)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(253,224,71,0.3)' },
    linkedinSection: { background: 'rgba(0,0,0,0.3)', border: '1px solid #444', borderRadius: '12px', padding: '16px', marginBottom: '16px' },
    linkedinLabel:   { fontSize: '0.82rem', color: '#aaa', marginBottom: '10px' },
    linkedinBtn:     { display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', width: '100%', padding: '12px 20px', background: '#0077B5', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', marginBottom: '6px', fontFamily: 'inherit' },
    copiedMsg: { fontSize: '0.78rem', color: '#4ade80', padding: '6px 10px', background: 'rgba(22,163,74,0.15)', border: '1px solid #16a34a', borderRadius: '6px', marginTop: '4px' },
    closeBtn: { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' },
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.box} onClick={e => e.stopPropagation()}>

        <span style={S.trophy}>🏆</span>
        <h2 style={S.title}>Quête validée !</h2>

        {queteTitre && (
          <p style={S.queteLabel}>✅ <strong>{queteTitre}</strong></p>
        )}

        <p style={S.sub}>+{points} XP • Niveau {level}</p>

        <div style={S.comps}>
          {competences.map((c, i) => (
            <div key={i} style={S.badge}>🎯 {c}</div>
          ))}
        </div>

        {/* ✅ Message clair : progression, pas maîtrise complète */}
        <p style={S.progressMsg}>
          📈 Vous progressez vers {competences.length > 1 ? 'ces compétences' : 'cette compétence'} !
          Continuez les quêtes associées pour la maîtriser complètement.
        </p>

        <div style={S.linkedinSection}>
          <p style={S.linkedinLabel}>
            📢 Partagez votre progression — texte <strong style={{color:'#4ade80'}}>copié auto</strong> :
          </p>
          {competences.map((c, i) => (
            <div key={i}>
              <button
                style={S.linkedinBtn}
                onMouseEnter={e => e.currentTarget.style.background = '#005885'}
                onMouseLeave={e => e.currentTarget.style.background = '#0077B5'}
                onClick={() => handleShare(c, i)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                Partager ma progression "{c}"
              </button>
              {copied === i && (
                <div style={S.copiedMsg}>
                  ✅ Texte copié ! Collez avec <strong>Ctrl+V</strong> dans votre post LinkedIn 🎉
                </div>
              )}
            </div>
          ))}
        </div>

        <button style={S.closeBtn} onClick={onClose}>Continuer ✨</button>
      </div>
    </div>
  );
}