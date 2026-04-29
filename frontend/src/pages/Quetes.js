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
  const [filtre, setFiltre]         = useState('tous');
  const [user, setUser]             = useState(null);
  const [modal, setModal]           = useState(null);

  useEffect(() => {
    getMesQuetes().then(r => {
      setQuetes(r.data);
      // ✅ Sélectionner automatiquement la première quête non validée
      const premiere = r.data.find(q => q.statut !== 'valide') || r.data[0];
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
        setModal({
          competences: res.data.competences_debloquees,
          points:      res.data.points_gagnes,
          level:       res.data.level,
        });
      }

    } catch (err) {
      if (err.response?.status === 401) return;

      const data = err.response?.data || {};
      setResult({
        succes: false,
        data: { message: data.message || data.error || 'Réponse incorrecte, réessayez !' }
      });

      if (err.response?.status === 422) {
        setQuetes(prev => prev.map(q =>
          q.quete.id === selected.quete.id
            ? { ...q, statut: 'refuse', feedback: data.message || '' }
            : q
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
    if (filtre === 'tous')       return true;
    if (filtre === 'a_faire')    return ['non_commence', 'refuse'].includes(uq.statut);
    if (filtre === 'en_attente') return uq.statut === 'soumis';
    if (filtre === 'valide')     return uq.statut === 'valide';
    return true;
  });

  const nb_valides = quetes.filter(q => q.statut === 'valide').length;
  const nb_attente = quetes.filter(q => q.statut === 'soumis').length;
  const total_xp   = quetes.reduce((sum, q) => sum + (q.points_gagnes || 0), 0);

  return (
    <div className="page">
      <h1>⚔️ Quêtes</h1>

      {modal && (
        <CompetenceUnlockedModal
          competences={modal.competences}
          username={user?.username}
          level={modal.level}
          points={modal.points}
          onClose={() => setModal(null)}
        />
      )}

      {/* Stats */}
      <div className="quetes-stats">
        <div className="stat-pill">✅ {nb_valides} validées</div>
        <div className="stat-pill">⏳ {nb_attente} en attente</div>
        <div className="stat-pill">🏆 {total_xp} XP gagnés</div>
      </div>

      {/* Filtres */}
      <div className="filtres">
        {['tous', 'a_faire', 'en_attente', 'valide'].map(f => (
          <button
            key={f}
            className={`filtre-btn ${filtre === f ? 'active' : ''}`}
            onClick={() => setFiltre(f)}
          >
            {f === 'tous' ? 'Toutes'
              : f === 'a_faire' ? 'À faire'
              : f === 'en_attente' ? 'En attente'
              : 'Validées'}
          </button>
        ))}
      </div>

      {/* Layout 2 colonnes */}
      <div className="quetes-layout">

        {/* ── COLONNE GAUCHE : liste avec scroll interne ── */}
        <div className="quetes-liste-wrapper">
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
                    <strong>{uq.quete.titre}</strong>
                    <span className="quete-diff">{DIFFICULTE[uq.quete.difficulte]}</span>
                  </div>
                  <div className="quete-card-right">
                    <span className="xp-badge">+{uq.quete.points} XP</span>
                    <span className="statut-badge" style={{ color: style.border }}>
                      {style.label}
                    </span>
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

        {/* ── COLONNE DROITE : détail sticky, jamais vide ── */}
        {selected ? (
          <div className="quete-detail">

            <h2>{selected.quete.icone} {selected.quete.titre}</h2>
            <span className="quete-diff">
              {DIFFICULTE[selected.quete.difficulte]} • +{selected.quete.points} XP
            </span>

            {/* Compétences débloquées */}
            {selected.quete.competences_debloquees?.length > 0 && (
              <div className="quete-detail-comps">
                <span className="quete-detail-comps-label">
                  🎯 Compétences débloquées automatiquement :
                </span>
                {selected.quete.competences_debloquees.map(c => (
                  <span key={c.id} className="quete-detail-comp-badge">{c.nom}</span>
                ))}
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

            {/* Résultat de la dernière soumission */}
            {result && (
              <div className={`feedback-box ${result.succes ? 'success' : 'error'}`}>
                {result.data.message}
                {result.data.points_gagnes > 0 && (
                  <span className="xp-earned"> +{result.data.points_gagnes} XP !</span>
                )}
              </div>
            )}

            {/* Formulaire soumission */}
            {['non_commence', 'en_cours', 'refuse'].includes(selected.statut) && (
              <form onSubmit={handleSoumettre} className="soumission-form">
                <h3>📤 Soumettre votre réponse</h3>
                <textarea
                  placeholder={TYPE_PLACEHOLDER[selected.quete.type_quete] || 'Votre réponse...'}
                  value={soumission}
                  onChange={e => setSoumission(e.target.value)}
                  rows={selected.quete.type_quete === 'admin_review' ? 5 : 2}
                  required
                />
                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? '⏳ Validation en cours...' : '🚀 Soumettre'}
                </button>
                {selected.statut === 'refuse' && (
                  <button
                    type="button"
                    className="btn-retry"
                    onClick={() => handleReessayer(selected.quete.id)}
                  >
                    🔄 Réinitialiser
                  </button>
                )}
              </form>
            )}

            {selected.statut === 'soumis' && (
              <div className="attente-box">
                ⏳ Soumission en attente de validation par un formateur.
              </div>
            )}

            {selected.statut === 'valide' && (
              <div className="valide-box">
                🎉 Quête complétée ! Vous avez gagné {selected.points_gagnes} XP.
              </div>
            )}

          </div>
        ) : (
          <div className="quete-detail-empty">
            <span className="empty-icon">⚔️</span>
            <p>Cliquez sur une quête<br/>pour voir les détails</p>
          </div>
        )}

      </div>

      {/* ── Styles spécifiques à cette page ── */}
      <style>{`
        .quetes-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          align-items: start;
        }

        /* Liste gauche : scroll interne, hauteur fixe */
        .quetes-liste-wrapper {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: calc(100vh - 220px);
          overflow-y: auto;
          padding-right: 4px;
        }
        .quetes-liste-wrapper::-webkit-scrollbar { width: 4px; }
        .quetes-liste-wrapper::-webkit-scrollbar-track { background: transparent; }
        .quetes-liste-wrapper::-webkit-scrollbar-thumb { background: #6f42c1; border-radius: 4px; }

        /* Panneau droit : sticky, ne scroll pas avec la page */
        .quete-detail {
          position: sticky;
          top: 76px;
          max-height: calc(100vh - 100px);
          overflow-y: auto;
          background: #1a1a2e;
          border: 1px solid #6f42c1;
          border-radius: 12px;
          padding: 20px;
        }
        .quete-detail::-webkit-scrollbar { width: 4px; }
        .quete-detail::-webkit-scrollbar-track { background: transparent; }
        .quete-detail::-webkit-scrollbar-thumb { background: #6f42c1; border-radius: 4px; }

        /* Panneau vide */
        .quete-detail-empty {
          position: sticky;
          top: 76px;
          background: #1a1a2e;
          border: 1px dashed #333;
          border-radius: 12px;
          padding: 60px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #555;
          text-align: center;
        }
        .empty-icon { font-size: 3rem; opacity: 0.3; }

        /* Compétences dans la liste */
        .quete-comps-preview {
          font-size: 0.75rem;
          color: #a78bfa;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid #2a1a5e;
        }

        /* Compétences dans le détail */
        .quete-detail-comps {
          background: rgba(111,66,193,0.1);
          border: 1px solid #6f42c1;
          border-radius: 8px;
          padding: 10px 12px;
          margin: 10px 0;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
        }
        .quete-detail-comps-label {
          font-size: 0.75rem;
          color: #a78bfa;
          width: 100%;
          margin-bottom: 4px;
        }
        .quete-detail-comp-badge {
          background: #6f42c1;
          color: white;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .quetes-vide {
          text-align: center;
          color: #666;
          padding: 40px;
          font-size: 0.9rem;
        }

        /* Mobile : colonne unique */
        @media (max-width: 800px) {
          .quetes-layout        { grid-template-columns: 1fr; }
          .quetes-liste-wrapper { max-height: none; overflow-y: visible; }
          .quete-detail         { position: static; max-height: none; }
          .quete-detail-empty   { position: static; }
        }
      `}</style>

    </div>
  );
}