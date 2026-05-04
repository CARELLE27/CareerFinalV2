import React from 'react';
import './CompetenceUnlockedModal.css';

/**
 * Modal qui s'affiche après validation d'une quête
 * Props :
 *   competences : string[]  — compétences débloquées
 *   queteTitre  : string    — titre de la quête validée
 *   username    : string
 *   level       : number
 *   points      : number
 *   onClose     : function
 */
export default function CompetenceUnlockedModal({
  competences,
  queteTitre,
  username,
  level,
  points,
  onClose
}) {
  if (!competences || competences.length === 0) return null;

  const handleShare = (competence) => {
    // ✅ Message mentionnant la quête réussie ET la compétence débloquée
    const texte = queteTitre
      ? `🎮 J'ai validé la quête "${queteTitre}" sur CareerQuest et débloqué la compétence "${competence}" !\n\n+${points} XP gagnés — Niveau ${level} atteint 🚀\n\n#CareerQuest #${competence.replace(/[\s\/\-]/g, '')} #Formation #Dev`
      : `🎮 J'ai débloqué la compétence "${competence}" sur CareerQuest !\n\nNiveau ${level} atteint 🚀\n\n#CareerQuest #${competence.replace(/[\s\/\-]/g, '')} #Formation`;

    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://careerquest.app')}&summary=${encodeURIComponent(texte)}`,
      '_blank',
      'width=600,height=600,scrollbars=yes'
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Trophée animé */}
        <div className="modal-trophy">🏆</div>

        <h2 className="modal-title">Compétence débloquée !</h2>

        {/* Quête validée */}
        {queteTitre && (
          <p className="modal-quete-label">
            ✅ Quête validée : <strong>{queteTitre}</strong>
          </p>
        )}

        <p className="modal-sub">+{points} XP • Niveau {level}</p>

        {/* Compétences débloquées */}
        <div className="modal-comps">
          {competences.map((c, i) => (
            <div key={i} className="modal-comp-badge">
              ✅ {c}
            </div>
          ))}
        </div>

        <p className="modal-msg">
          Ces compétences ont été ajoutées automatiquement à votre profil !
        </p>

        {/* Bouton LinkedIn par compétence */}
        <div className="modal-linkedin-section">
          <p className="modal-linkedin-label">
            📢 Partagez votre réussite sur LinkedIn :
          </p>
          {competences.map((c, i) => (
            <button
              key={i}
              className="linkedin-share-btn"
              onClick={() => handleShare(c)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Partager "{c}" sur LinkedIn
            </button>
          ))}
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          Continuer ✨
        </button>
      </div>
    </div>
  );
}