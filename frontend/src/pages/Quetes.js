import React, { useState, useEffect } from 'react';
import { getMesQuetes, soumettreQuete, reessayerQuete } from '../services/api';

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

  useEffect(() => {
    getMesQuetes().then(r => setQuetes(r.data));
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
    } catch (err) {
      const data = err.response?.data || {};
      setResult({ succes: false, data: { message: data.message || data.error || 'Erreur de validation' } });
      getMesQuetes().then(r => setQuetes(r.data));
    }
    setLoading(false);
  };

  const handleReessayer = async (quete_id) => {
    await reessayerQuete(quete_id);
    getMesQuetes().then(r => setQuetes(r.data));
    setResult(null);
    setSoumission('');
  };

  const filtrees = quetes.filter(uq => {
    if (filtre === 'tous')         return true;
    if (filtre === 'a_faire')      return ['non_commence', 'refuse'].includes(uq.statut);
    if (filtre === 'en_attente')   return uq.statut === 'soumis';
    if (filtre === 'valide')       return uq.statut === 'valide';
    return true;
  });

  const nb_valides = quetes.filter(q => q.statut === 'valide').length;
  const nb_attente = quetes.filter(q => q.statut === 'soumis').length;
  const total_xp   = quetes.reduce((sum, q) => sum + (q.points_gagnes || 0), 0);

  return (
    <div className="page">
      <h1>⚔️ Quêtes</h1>

      {/* Stats */}
      <div className="quetes-stats">
        <div className="stat-pill">✅ {nb_valides} validées</div>
        <div className="stat-pill">⏳ {nb_attente} en attente</div>
        <div className="stat-pill">🏆 {total_xp} XP gagnés</div>
      </div>

      {/* Filtres */}
      <div className="filtres">
        {['tous','a_faire','en_attente','valide'].map(f => (
          <button
            key={f}
            className={`filtre-btn ${filtre === f ? 'active' : ''}`}
            onClick={() => setFiltre(f)}
          >
            { f === 'tous' ? 'Toutes' :
              f === 'a_faire' ? 'À faire' :
              f === 'en_attente' ? 'En attente' : 'Validées' }
          </button>
        ))}
      </div>

      <div className="quetes-layout">
        {/* Liste */}
        <div className="quetes-liste">
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
              </div>
            );
          })}
        </div>

        {/* Détail & Soumission */}
        {selected && (
          <div className="quete-detail">
            <h2>{selected.quete.icone} {selected.quete.titre}</h2>
            <span className="quete-diff">{DIFFICULTE[selected.quete.difficulte]} • +{selected.quete.points} XP</span>

            <div className="instructions-box">
              <h3>📋 Instructions</h3>
              <pre className="instructions-text">{selected.quete.instructions}</pre>
            </div>

            {/* Feedback précédent */}
            {selected.feedback && (
              <div className={`feedback-box ${selected.statut === 'valide' ? 'success' : 'error'}`}>
                <strong>Résultat :</strong> {selected.feedback}
                {selected.points_gagnes > 0 && (
                  <span className="xp-earned"> +{selected.points_gagnes} XP gagnés !</span>
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

            {/* Formulaire de soumission */}
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
        )}
      </div>
    </div>
  );
}
