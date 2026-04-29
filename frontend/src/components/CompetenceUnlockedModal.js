import React from 'react';
import LinkedInShare from './LinkedInShare';
import './CompetenceUnlockedModal.css';

/**
 * Modal qui s'affiche automatiquement quand une quête est validée
 * et que des compétences sont débloquées.
 *
 * Props :
 *   competences : string[]  — liste des compétences débloquées
 *   username    : string
 *   level       : number
 *   points      : number    — XP gagnés
 *   onClose     : function
 */
export default function CompetenceUnlockedModal({ competences, username, level, points, onClose }) {
  if (!competences || competences.length === 0) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Animation trophée */}
        <div className="modal-trophy">🏆</div>

        <h2 className="modal-title">Compétence débloquée !</h2>
        <p className="modal-sub">+{points} XP • Niveau {level}</p>

        {/* Liste des compétences débloquées */}
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

        {/* Boutons LinkedIn — un par compétence */}
        <div className="modal-linkedin-section">
          <p className="modal-linkedin-label">📢 Partagez votre succès :</p>
          {competences.map((c, i) => (
            <LinkedInShare
              key={i}
              competence={c}
              username={username}
              level={level}
            />
          ))}
        </div>

        <button className="modal-close-btn" onClick={onClose}>
          Continuer ✨
        </button>
      </div>
    </div>
  );
}
