import React, { useState, useEffect } from 'react';
import { getMesQuetes, soumettreQuete, reessayerQuete, getProfil } from '../services/api';
import CompetenceUnlockedModal from '../components/CompetenceUnlockedModal';

const DIFFICULTE = { 1: '⭐ Facile', 2: '⭐⭐ Moyen', 3: '⭐⭐⭐ Difficile' };

const STATUT_STYLE = {
  non_commence: { bg: '#1a1a2e', border: '#444',    label: '🔒 Non commencé' },
  en_cours:     { bg: '#1a2a3e', border: '#0d6efd', label: '🔄 En cours' },
  soumis:       { bg: '#2a2a1e', border: '#ffc107', label: '⏳ En attente' },
  valide:       { bg: '#1a2e1a', border: '#28a745', label: '✅ Validé' },
  refuse:       { bg: '#2e1a1a', border: '#dc3545', label: '❌ Refusé' },
};

const TYPE_PLACEHOLDER = {
  github_repo:   'Nom de votre repo GitHub (ex: mon-portfolio)',
  github_commit: 'Nom de votre repo GitHub (ex: mon-projet)',
  github_file:   'Nom de votre repo GitHub (ex: mon-app-docker)',
  quiz:          'Entrez la lettre de votre réponse (a, b, c ou d)',
  url_submit:    'URL complète (ex: https://mon-site.render.com)',
  admin_review:  'Décrivez ce que vous avez accompli...',
};

export default function Quetes() {
  const [quetes, setQuetes]         = useState([]);
  const [selected, setSelected]     = useState(null);
  const [soumission, setSoumission] = useState('');
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [filtre, setFiltre]         = useState('recommandees');
  const [user, setUser]             = useState(null);
  const [modal, setModal]           = useState(null);

  useEffect(() => {
    getMesQuetes().then(r => {
      setQuetes(r.data);
      const premiere = r.data.find(q => q.recommandee && q.statut !== 'valide')
        || r.data.find(q => q.statut !== 'valide')
        || r.data[0];
      if (premiere) setSelected(premiere);
    }).catch(() => {});
    getProfil().then(r => setUser(r.data)).catch(() => {});
  }, []);

  const handleOuvrir = (uq) => {
    setSelected(uq);
    setSoumission('');
    setResult(null);
  };

  const handleSoumettre = async (e) => {
    e.preventDefault();
    if (!soumission.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await soumettreQuete(selected.quete.id, soumission);
      setResult({ succes: res.data.statut === 'valide', data: res.data });
      getMesQuetes().then(r => setQuetes(r.data));
      getProfil().then(r => setUser(r.data));
      if (res.data.statut === 'valide' && res.data.competences_debloquees?.length > 0) {
        setModal({ competences: res.data.competences_debloquees, points: res.data.points_gagnes, level: res.data.level });
      }
    } catch (err) {
      if (err.response?.status === 401) return;
      const data = err.response?.data || {};
      setResult({ succes: false, data: { message: data.message || data.error || 'Réponse incorrecte, réessayez !' } });
      if (err.response?.status === 422) {
        setQuetes(prev => prev.map(q =>
          q.quete.id === selected.quete.id ? { ...q, statut: 'refuse', feedback: data.message || '' } : q
        ));
        setSelected(prev => ({ ...prev, statut: 'refuse', feedback: data.message || '' }));
      }
    }
    setLoading(false);
  };

  const handleReessayer = async (quete_id) => {
    try {
      await reessayerQuete(quete_id);
      getMesQuetes().then(r => setQuetes(r.data));
      setResult(null);
      setSoumission('');
      setSelected(prev => ({ ...prev, statut: 'non_commence', feedback: '' }));
    } catch {}
  };

  const filtrees = quetes.filter(uq => {
    if (filtre === 'recommandees') return uq.recommandee;
    if (filtre === 'toutes')       return true;
    if (filtre === 'a_faire')      return ['non_commence', 'refuse'].includes(uq.statut);
    if (filtre === 'en_attente')   return uq.statut === 'soumis';
    if (filtre === 'valide')       return uq.statut === 'valide';
    return true;
  });

  const nb_valides = quetes.filter(q => q.statut === 'valide').length;
  const nb_attente = quetes.filter(q => q.statut === 'soumis').length;
  const nb_recomm  = quetes.filter(q => q.recommandee).length;
  const total_xp   = quetes.reduce((sum, q) => sum + (q.points_gagnes || 0), 0);

  return (
    <div className="quetes-root">

      {modal && (
        <CompetenceUnlockedModal
          competences={modal.competences}
          username={user?.username}
          level={modal.level}
          points={modal.points}
          onClose={() => setModal(null)}
        />
      )}

      {/* ══ LAYOUT : colonne gauche + colonne droite dès le haut ══ */}
      <div className="quetes-body">

        {/* ── COLONNE GAUCHE : titre + stats + filtres + liste ── */}
        <div className="quetes-col-left">

          {/* Titre */}
          <h1 className="quetes-titre">⚔️ Quêtes</h1>

          {/* Stats */}
          <div className="quetes-stats">
            <div className="stat-pill">✅ {nb_valides} validées</div>
            <div className="stat-pill">⏳ {nb_attente} en attente</div>
            <div className="stat-pill">🏆 {total_xp} XP gagnés</div>
          </div>

          {/* Filtres */}
          <div className="filtres">
            {[
              { id: 'recommandees', label: `⭐ Ma filière (${nb_recomm})` },
              { id: 'toutes',       label: 'Toutes' },
              { id: 'a_faire',      label: 'À faire' },
              { id: 'en_attente',   label: 'En attente' },
              { id: 'valide',       label: 'Validées' },
            ].map(f => (
              <button
                key={f.id}
                className={`filtre-btn ${filtre === f.id ? 'active' : ''}`}
                onClick={() => setFiltre(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Liste des quêtes */}
          <div className="quetes-liste-inner">
            {filtrees.length === 0 && (
              <div className="quetes-vide">Aucune quête dans cette catégorie</div>
            )}
            {filtrees.map(uq => {
              const style = STATUT_STYLE[uq.statut] || STATUT_STYLE.non_commence;
              return (
                <div
                  key={uq.id}
                  className={`quete-card-new ${selected?.id === uq.id ? 'selected' : ''}`}
                  style={{ borderColor: style.border, background: style.bg }}
                  onClick={() => handleOuvrir(uq)}
                >
                  <div className="quete-card-top">
                    <span className="quete-icone-big">{uq.quete.icone}</span>
                    <div className="quete-card-info">
                      <strong>
                        {uq.recommandee && <span style={{ color: '#fde047' }}>⭐ </span>}
                        {uq.quete.titre}
                      </strong>
                      <span className="quete-diff">{DIFFICULTE[uq.quete.difficulte]}</span>
                    </div>
                    <div className="quete-card-right">
                      <span className="xp-badge">+{uq.quete.points} XP</span>
                      <span className="statut-badge" style={{ color: style.border }}>{style.label}</span>
                    </div>
                  </div>
                  <p className="quete-desc-short">{uq.quete.description}</p>
                  {uq.quete.competences_debloquees?.length > 0 && (
                    <div className="quete-comps-preview">
                      🎯 Débloque : {uq.quete.competences_debloquees.map(c => c.nom).join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── COLONNE DROITE : commence tout en haut ── */}
        <div className="quetes-col-right">
          {selected ? (
            <div className="quete-detail-inner">

              <h2>{selected.quete.icone} {selected.quete.titre}</h2>
              <span className="quete-diff">
                {DIFFICULTE[selected.quete.difficulte]} • +{selected.quete.points} XP
              </span>

              {/* Compétences */}
              {selected.quete.competences_debloquees?.length > 0 && (
                <div className="quete-detail-comps">
                  <span className="quete-detail-comps-label">🎯 Compétences débloquées :</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {selected.quete.competences_debloquees.map(c => (
                      <span key={c.id} className="quete-detail-comp-badge">{c.nom}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="instructions-box">
                <h3>📋 Instructions</h3>
                <pre className="instructions-text">{selected.quete.instructions}</pre>
              </div>

              {/* Feedback précédent */}
              {selected.feedback && (
                <div className={`feedback-box ${selected.statut === 'valide' ? 'success' : 'error'}`}>
                  <strong>Résultat :</strong> {selected.feedback}
                  {selected.points_gagnes > 0 && (
                    <span className="xp-earned"> +{selected.points_gagnes} XP !</span>
                  )}
                </div>
              )}

              {/* Résultat soumission */}
              {result && (
                <div className={`feedback-box ${result.succes ? 'success' : 'error'}`}>
                  {result.data.message}
                  {result.data.points_gagnes > 0 && (
                    <span className="xp-earned"> +{result.data.points_gagnes} XP !</span>
                  )}
                </div>
              )}

              {/* Formulaire */}
              {['non_commence', 'en_cours', 'refuse'].includes(selected.statut) && (
                <form onSubmit={handleSoumettre} className="soumission-form">
                  <h3>📤 Soumettre votre réponse</h3>
                  <textarea
                    placeholder={TYPE_PLACEHOLDER[selected.quete.type_quete] || 'Votre réponse...'}
                    value={soumission}
                    onChange={e => setSoumission(e.target.value)}
                    rows={selected.quete.type_quete === 'admin_review' ? 4 : 2}
                    required
                  />
                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? '⏳ Validation...' : '🚀 Soumettre'}
                  </button>
                  {selected.statut === 'refuse' && (
                    <button type="button" className="btn-retry"
                      onClick={() => handleReessayer(selected.quete.id)}>
                      🔄 Réinitialiser
                    </button>
                  )}
                </form>
              )}

              {selected.statut === 'soumis' && (
                <div className="attente-box">⏳ En attente de validation par un formateur.</div>
              )}

              {selected.statut === 'valide' && (
                <div className="valide-box">
                  🎉 Quête complétée ! +{selected.points_gagnes} XP
                  {selected.quete.competences_debloquees?.length > 0 && (
                    <button
                      className="linkedin-share-btn"
                      style={{ marginTop: '12px', width: '100%' }}
                      onClick={() => {
                        const comp = selected.quete.competences_debloquees.map(c => c.nom).join(', ');
                        const texte = `🎮 J'ai validé "${selected.quete.titre}" sur CareerQuest et débloqué "${comp}" ! #CareerQuest #Formation`;
                        window.open(
                          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://careerquest.app')}&summary=${encodeURIComponent(texte)}`,
                          '_blank', 'width=600,height=600'
                        );
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      Partager sur LinkedIn
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="quete-detail-empty">
              <span style={{ fontSize: '3rem', opacity: 0.3 }}>⚔️</span>
              <p>Cliquez sur une quête<br/>pour voir les détails</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        /* ── PAGE ── */
        .quetes-root {
          height: calc(100vh - 60px);
          overflow: hidden;
          padding: 0 24px;
          display: flex;
          flex-direction: column;
        }

        /* ── BODY 2 COLONNES dès le haut ── */
        .quetes-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          flex: 1;
          overflow: hidden;
          padding: 16px 0;
        }

        /* ── COLONNE GAUCHE ── */
        .quetes-col-left {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          gap: 8px;
        }
        .quetes-titre {
          font-size: 1.6rem;
          font-weight: 700;
          margin: 0;
          flex-shrink: 0;
        }
        .quetes-stats {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }
        .filtres {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          flex-shrink: 0;
        }

        /* Liste scrollable */
        .quetes-liste-inner {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 4px;
        }
        .quetes-liste-inner::-webkit-scrollbar { width: 4px; }
        .quetes-liste-inner::-webkit-scrollbar-thumb { background: #6f42c1; border-radius: 4px; }

        /* ── COLONNE DROITE : commence tout en haut ── */
        .quetes-col-right {
          overflow-y: auto;
          background: #1a1a2e;
          border: 1px solid #6f42c1;
          border-radius: 12px;
          /* ✅ Pas de margin-top → commence au niveau du titre */
        }
        .quetes-col-right::-webkit-scrollbar { width: 4px; }
        .quetes-col-right::-webkit-scrollbar-thumb { background: #6f42c1; border-radius: 4px; }

        .quete-detail-inner { padding: 20px; }
        .quete-detail-inner h2 { font-size: 1.1rem; margin-bottom: 6px; }

        .quete-detail-empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #555;
          text-align: center;
        }

        /* Instructions */
        .instructions-box {
          background: #07071a;
          border: 1px solid #2a1a5e;
          border-radius: 8px;
          padding: 14px;
          margin: 12px 0;
        }
        .instructions-box h3 { font-size: 0.9rem; color: #a78bfa; margin-bottom: 8px; }
        .instructions-text {
          font-family: inherit;
          font-size: 0.85rem;
          color: #ccc;
          white-space: pre-wrap;
          word-break: break-word;
          margin: 0;
          line-height: 1.6;
        }

        /* Compétences */
        .quete-detail-comps {
          background: rgba(111,66,193,0.1);
          border: 1px solid #6f42c1;
          border-radius: 8px;
          padding: 10px 12px;
          margin: 10px 0;
        }
        .quete-detail-comps-label { font-size: 0.75rem; color: #a78bfa; }
        .quete-detail-comp-badge {
          background: #6f42c1; color: white;
          padding: 3px 10px; border-radius: 12px;
          font-size: 0.75rem; font-weight: 700;
        }

        /* Liste quêtes */
        .quete-comps-preview {
          font-size: 0.75rem; color: #a78bfa;
          margin-top: 6px; padding-top: 6px;
          border-top: 1px solid #2a1a5e;
        }
        .quetes-vide { text-align: center; color: #666; padding: 40px; font-size: 0.9rem; }

        /* Formulaire */
        .soumission-form { margin-top: 14px; }
        .soumission-form h3 { font-size: 0.9rem; color: #a78bfa; margin-bottom: 8px; }
        .soumission-form textarea {
          width: 100%; background: #07071a; border: 1px solid #444;
          border-radius: 8px; color: white; padding: 10px;
          font-family: inherit; font-size: 0.85rem;
          resize: vertical; margin-bottom: 8px; box-sizing: border-box;
        }

        /* Feedback */
        .feedback-box { border-radius: 8px; padding: 10px 12px; margin: 10px 0; font-size: 0.85rem; }
        .feedback-box.success { background: rgba(22,163,74,0.15); border: 1px solid #16a34a; color: #4ade80; }
        .feedback-box.error   { background: rgba(220,38,38,0.15); border: 1px solid #dc2626; color: #f87171; }
        .xp-earned { font-weight: 700; color: #fde047; }
        .attente-box { background: rgba(202,138,4,0.15); border: 1px solid #ca8a04; color: #fde047; border-radius: 8px; padding: 12px; font-size: 0.85rem; margin-top: 12px; }
        .valide-box  { background: rgba(22,163,74,0.15); border: 1px solid #16a34a; color: #4ade80; border-radius: 8px; padding: 12px; font-size: 0.85rem; margin-top: 12px; }

        /* Mobile */
        @media (max-width: 800px) {
          .quetes-root { height: auto; overflow: visible; }
          .quetes-body { grid-template-columns: 1fr; overflow: visible; }
          .quetes-liste-inner { overflow-y: visible; }
          .quetes-col-right { overflow-y: visible; }
        }
      `}</style>
    </div>
  );
}