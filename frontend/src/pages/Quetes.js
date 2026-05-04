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

// ── Bouton LinkedIn sur carte validée ────────────────────
function LinkedInBtn({ quete, style = {} }) {
  const comp = quete.competences_debloquees?.map(c => c.nom).join(', ');
  if (!comp) return null;
  const texte = `🎮 J'ai validé "${quete.titre}" sur CareerQuest et débloqué "${comp}" ! #CareerQuest #Formation`;
  return (
    <button className="linkedin-card-btn" style={style}
      onClick={e => {
        e.stopPropagation();
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://careerquest.app')}&summary=${encodeURIComponent(texte)}`,
          '_blank', 'width=600,height=600'
        );
      }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
      Partager
    </button>
  );
}

// ── Vue par compétence ────────────────────────────────────
function VueParCompetence({ quetes, onSelect, selected }) {

  // Construire les parcours par compétence
  const parcours = {};

  quetes.forEach(uq => {
    const comps = uq.quete.competences_debloquees || [];
    if (comps.length === 0) {
      // Quête sans compétence → groupe "Général"
      if (!parcours['__general__']) {
        parcours['__general__'] = { nom: '🎯 Général', quetes: [] };
      }
      parcours['__general__'].quetes.push(uq);
    } else {
      comps.forEach(c => {
        if (!parcours[c.id]) {
          parcours[c.id] = { nom: c.nom, quetes: [] };
        }
        // Éviter doublons
        if (!parcours[c.id].quetes.find(q => q.id === uq.id)) {
          parcours[c.id].quetes.push(uq);
        }
      });
    }
  });

  // Trier chaque parcours par difficulté
  Object.values(parcours).forEach(p => {
    p.quetes.sort((a, b) => a.quete.difficulte - b.quete.difficulte);
  });

  return (
    <div className="vpc-wrap">
      {Object.entries(parcours).map(([key, parcour]) => {
        const total   = parcour.quetes.length;
        const valides = parcour.quetes.filter(q => q.statut === 'valide').length;
        const pct     = Math.round((valides / total) * 100);
        // Prochaine quête = première non validée
        const prochaine = parcour.quetes.find(q => q.statut !== 'valide');

        return (
          <div key={key} className="vpc-parcour">

            {/* En-tête parcours */}
            <div className="vpc-header">
              <div className="vpc-header-left">
                <span className="vpc-nom">🎓 {parcour.nom}</span>
                <span className="vpc-count">{valides}/{total} validées</span>
              </div>
              <div className="vpc-bar-wrap">
                <div className="vpc-bar-bg">
                  <div className="vpc-bar-fill" style={{ width: `${pct}%` }} />
                </div>
                <span className="vpc-pct">{pct}%</span>
              </div>
            </div>

            {/* Chemin des quêtes */}
            <div className="vpc-chemin">
              {parcour.quetes.map((uq, i) => {
                const style    = STATUT_STYLE[uq.statut] || STATUT_STYLE.non_commence;
                const estProch = prochaine?.id === uq.id;
                const isSelected = selected?.id === uq.id;

                return (
                  <React.Fragment key={uq.id}>
                    {/* Connecteur */}
                    {i > 0 && (
                      <div className={`vpc-connector ${parcour.quetes[i-1].statut === 'valide' ? 'done' : ''}`}>
                        →
                      </div>
                    )}

                    {/* Carte quête */}
                    <div
                      className={`vpc-quete-card ${isSelected ? 'selected' : ''} ${estProch ? 'prochaine' : ''}`}
                      style={{ borderColor: estProch ? '#fde047' : style.border }}
                      onClick={() => onSelect(uq)}
                    >
                      {/* Badge prochaine */}
                      {estProch && (
                        <div className="vpc-badge-prochaine">✈️ Suivante</div>
                      )}

                      <div className="vpc-quete-top">
                        <span className="vpc-quete-icone">{uq.quete.icone}</span>
                        <div className="vpc-quete-info">
                          <strong>{uq.quete.titre}</strong>
                          <div className="vpc-quete-meta">
                            <span>{DIFFICULTE[uq.quete.difficulte]}</span>
                            <span className="vpc-xp">+{uq.quete.points} XP</span>
                          </div>
                        </div>
                        <span className="vpc-statut" style={{ color: estProch ? '#fde047' : style.border }}>
                          {estProch ? '✈️' : style.label.split(' ')[0]}
                        </span>
                      </div>

                      {/* Bouton LinkedIn si validée */}
                      {uq.statut === 'valide' && uq.quete.competences_debloquees?.length > 0 && (
                        <div className="vpc-footer">
                          <span style={{ fontSize: '0.7rem', color: '#4ade80' }}>✅ Compétence débloquée !</span>
                          <LinkedInBtn quete={uq.quete} />
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}

              {/* Récompense finale */}
              <div className="vpc-connector done">→</div>
              <div className={`vpc-reward ${valides === total ? 'unlocked' : ''}`}>
                {valides === total ? '🏆' : '🔒'}
                <span>{parcour.nom}</span>
                <span style={{ fontSize: '0.6rem' }}>{valides === total ? 'Maîtrisée !' : 'Compétence'}</span>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}

// ── COMPOSANT PRINCIPAL ───────────────────────────────────
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
        setModal({ competences: res.data.competences_debloquees, points: res.data.points_gagnes, level: res.data.level, queteTitre: selected.quete.titre });
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

  // Filtres classiques
  const filtrees = quetes.filter(uq => {
    if (filtre === 'recommandees')  return uq.recommandee;
    if (filtre === 'par_competence')return true; // géré par VueParCompetence
    if (filtre === 'toutes')        return true;
    if (filtre === 'a_faire')       return ['non_commence', 'refuse'].includes(uq.statut);
    if (filtre === 'en_attente')    return uq.statut === 'soumis';
    if (filtre === 'valide')        return uq.statut === 'valide';
    return true;
  });

  const nb_valides = quetes.filter(q => q.statut === 'valide').length;
  const nb_attente = quetes.filter(q => q.statut === 'soumis').length;
  const nb_recomm  = quetes.filter(q => q.recommandee).length;
  const total_xp   = quetes.reduce((sum, q) => sum + (q.points_gagnes || 0), 0);

  const modeCompetence = filtre === 'par_competence';

  return (
    <div className="quetes-root">
      {modal && (
        <CompetenceUnlockedModal
          competences={modal.competences}
          queteTitre={modal.queteTitre}
          username={user?.username}
          level={modal.level}
          points={modal.points}
          onClose={() => setModal(null)}
        />
      )}

      <div className={`quetes-body ${modeCompetence ? 'mode-comp' : ''}`}>

        {/* ── COLONNE GAUCHE ── */}
        <div className="quetes-col-left">
          <h1 className="quetes-titre">⚔️ Quêtes</h1>

          <div className="quetes-stats">
            <div className="stat-pill">✅ {nb_valides} validées</div>
            <div className="stat-pill">⏳ {nb_attente} en attente</div>
            <div className="stat-pill">🏆 {total_xp} XP gagnés</div>
          </div>

          <div className="filtres">
            {[
              { id: 'recommandees',   label: `⭐ Ma filière (${nb_recomm})` },
              { id: 'par_competence', label: '🎓 Par compétence' },
              { id: 'toutes',         label: 'Toutes' },
              { id: 'a_faire',        label: 'À faire' },
              { id: 'en_attente',     label: 'En attente' },
              { id: 'valide',         label: 'Validées' },
            ].map(f => (
              <button key={f.id}
                className={`filtre-btn ${filtre === f.id ? 'active' : ''} ${f.id === 'par_competence' ? 'filtre-special' : ''}`}
                onClick={() => setFiltre(f.id)}>
                {f.label}
              </button>
            ))}
          </div>

          {/* ── VUE PAR COMPÉTENCE (pleine largeur) ── */}
          {modeCompetence ? (
            <div className="vpc-container">
              <VueParCompetence
                quetes={quetes}
                onSelect={handleOuvrir}
                selected={selected}
              />
            </div>
          ) : (
            /* ── VUE LISTE CLASSIQUE ── */
            <div className="quetes-liste-inner">
              {filtrees.length === 0 && <div className="quetes-vide">Aucune quête ici</div>}
              {filtrees.map(uq => {
                const style = STATUT_STYLE[uq.statut] || STATUT_STYLE.non_commence;
                return (
                  <div key={uq.id}
                    className={`quete-card-new ${selected?.id === uq.id ? 'selected' : ''}`}
                    style={{ borderColor: style.border, background: style.bg }}
                    onClick={() => handleOuvrir(uq)}>
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
                    {uq.statut === 'valide' && uq.quete.competences_debloquees?.length > 0 && (
                      <div className="quete-card-footer">
                        <span className="quete-comps-preview">
                          🎯 {uq.quete.competences_debloquees.map(c => c.nom).join(', ')}
                        </span>
                        <LinkedInBtn quete={uq.quete} />
                      </div>
                    )}
                    {uq.statut !== 'valide' && uq.quete.competences_debloquees?.length > 0 && (
                      <div className="quete-comps-preview">
                        🎯 Débloque : {uq.quete.competences_debloquees.map(c => c.nom).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── COLONNE DROITE — masquée en mode compétence ── */}
        {!modeCompetence && (
          <div className="quetes-col-right">
            {selected ? (
              <div className="quete-detail-inner">
                <h2>{selected.quete.icone} {selected.quete.titre}</h2>
                <span className="quete-diff">
                  {DIFFICULTE[selected.quete.difficulte]} • +{selected.quete.points} XP
                </span>

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

                <div className="instructions-box">
                  <h3>📋 Instructions</h3>
                  <pre className="instructions-text">{selected.quete.instructions}</pre>
                </div>

                {selected.feedback && (
                  <div className={`feedback-box ${selected.statut === 'valide' ? 'success' : 'error'}`}>
                    <strong>Résultat :</strong> {selected.feedback}
                    {selected.points_gagnes > 0 && <span className="xp-earned"> +{selected.points_gagnes} XP !</span>}
                  </div>
                )}

                {result && (
                  <div className={`feedback-box ${result.succes ? 'success' : 'error'}`}>
                    {result.data.message}
                    {result.data.points_gagnes > 0 && <span className="xp-earned"> +{result.data.points_gagnes} XP !</span>}
                  </div>
                )}

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
                      <LinkedInBtn quete={selected.quete} style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }} />
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
        )}
      </div>

      <style>{`
        .quetes-root { height: calc(100vh - 60px); overflow: hidden; padding: 0 24px; display: flex; flex-direction: column; }
        .quetes-body { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex: 1; overflow: hidden; padding: 16px 0; }
        .quetes-body.mode-comp { grid-template-columns: 1fr; }
        .quetes-col-left { display: flex; flex-direction: column; overflow: hidden; gap: 8px; }
        .quetes-titre { font-size: 1.6rem; font-weight: 700; margin: 0; flex-shrink: 0; }
        .quetes-stats { display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0; }
        .filtres { display: flex; gap: 6px; flex-wrap: wrap; flex-shrink: 0; }
        .filtre-special { border-color: #fde047 !important; color: #fde047 !important; }
        .filtre-special.active { background: #fde047 !important; color: #000 !important; }
        .quetes-liste-inner { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding-right: 4px; }
        .quetes-liste-inner::-webkit-scrollbar { width: 4px; }
        .quetes-liste-inner::-webkit-scrollbar-thumb { background: #6f42c1; border-radius: 4px; }
        .quetes-col-right { overflow-y: auto; background: #1a1a2e; border: 1px solid #6f42c1; border-radius: 12px; }
        .quetes-col-right::-webkit-scrollbar { width: 4px; }
        .quetes-col-right::-webkit-scrollbar-thumb { background: #6f42c1; border-radius: 4px; }
        .quete-detail-inner { padding: 20px; }
        .quete-detail-inner h2 { font-size: 1.1rem; margin-bottom: 6px; }
        .quete-detail-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #555; text-align: center; }

        /* ── VUE PAR COMPÉTENCE ── */
        .vpc-container { flex: 1; overflow-y: auto; padding-right: 4px; }
        .vpc-container::-webkit-scrollbar { width: 4px; }
        .vpc-container::-webkit-scrollbar-thumb { background: #6f42c1; border-radius: 4px; }
        .vpc-wrap { display: flex; flex-direction: column; gap: 20px; padding-bottom: 20px; }

        .vpc-parcour { background: #0d0d2b; border: 1px solid #2a1a5e; border-radius: 14px; padding: 16px; }

        .vpc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
        .vpc-header-left { display: flex; align-items: center; gap: 10px; }
        .vpc-nom { font-size: 0.95rem; font-weight: 700; color: #a78bfa; }
        .vpc-count { font-size: 0.75rem; color: #888; background: #1a1a2e; padding: 2px 8px; border-radius: 10px; }
        .vpc-bar-wrap { display: flex; align-items: center; gap: 8px; flex: 1; max-width: 200px; }
        .vpc-bar-bg { flex: 1; background: #1a1a2e; border-radius: 4px; height: 6px; overflow: hidden; }
        .vpc-bar-fill { background: linear-gradient(90deg, #7c3aed, #4ade80); height: 100%; border-radius: 4px; transition: width 0.4s ease; }
        .vpc-pct { font-size: 0.72rem; color: #a78bfa; font-weight: 700; }

        /* Chemin horizontal scrollable */
        .vpc-chemin { display: flex; align-items: center; gap: 0; overflow-x: auto; padding: 8px 0 12px; }
        .vpc-chemin::-webkit-scrollbar { height: 4px; }
        .vpc-chemin::-webkit-scrollbar-thumb { background: #6f42c1; border-radius: 4px; }

        .vpc-connector { color: #444; font-size: 1.2rem; padding: 0 6px; flex-shrink: 0; }
        .vpc-connector.done { color: #4ade80; }

        /* Carte quête dans le parcours */
        .vpc-quete-card {
          position: relative;
          background: #1a1a2e;
          border: 1.5px solid;
          border-radius: 10px;
          padding: 10px;
          min-width: 170px;
          max-width: 200px;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.2s;
        }
        .vpc-quete-card:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
        .vpc-quete-card.selected { box-shadow: 0 0 0 2px #7c3aed; }
        .vpc-quete-card.prochaine { box-shadow: 0 0 12px rgba(253,224,71,0.3); }

        .vpc-badge-prochaine {
          position: absolute; top: -10px; left: 50%; transform: translateX(-50%);
          background: #fde047; color: #000; font-size: 0.6rem; font-weight: 700;
          padding: 2px 8px; border-radius: 10px; white-space: nowrap;
        }

        .vpc-quete-top { display: flex; align-items: flex-start; gap: 8px; }
        .vpc-quete-icone { font-size: 1.3rem; flex-shrink: 0; }
        .vpc-quete-info { flex: 1; }
        .vpc-quete-info strong { font-size: 0.75rem; color: #e0e0f0; display: block; line-height: 1.3; margin-bottom: 3px; }
        .vpc-quete-meta { display: flex; gap: 6px; flex-wrap: wrap; }
        .vpc-quete-meta span { font-size: 0.65rem; color: #888; }
        .vpc-xp { color: #a78bfa !important; font-weight: 700; }
        .vpc-statut { font-size: 0.85rem; flex-shrink: 0; }

        .vpc-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(74,222,128,0.2); }

        /* Récompense finale */
        .vpc-reward {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: #1a1a2e; border: 1.5px dashed #444;
          border-radius: 10px; padding: 10px; min-width: 80px;
          text-align: center; flex-shrink: 0; gap: 2px;
        }
        .vpc-reward span { font-size: 0.6rem; color: #888; }
        .vpc-reward > span:first-of-type { font-size: 0.7rem; color: #a78bfa; font-weight: 700; }
        .vpc-reward > :first-child { font-size: 1.4rem; }
        .vpc-reward.unlocked {
          border-color: #fde047; background: rgba(253,224,71,0.08);
          animation: glow-gold 1.5s ease infinite alternate;
        }
        .vpc-reward.unlocked span { color: #fde047 !important; }

        @keyframes glow-gold {
          from { box-shadow: 0 0 6px rgba(253,224,71,0.2); }
          to   { box-shadow: 0 0 18px rgba(253,224,71,0.5); }
        }

        /* LinkedIn bouton */
        .linkedin-card-btn { display: flex; align-items: center; gap: 5px; background: #0077b5; color: white; border: none; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.7rem; font-weight: 700; white-space: nowrap; transition: all 0.2s; flex-shrink: 0; }
        .linkedin-card-btn:hover { background: #005885; }

        /* Instructions */
        .instructions-box { background: #07071a; border: 1px solid #2a1a5e; border-radius: 8px; padding: 14px; margin: 12px 0; }
        .instructions-box h3 { font-size: 0.9rem; color: #a78bfa; margin-bottom: 8px; }
        .instructions-text { font-family: inherit; font-size: 0.85rem; color: #ccc; white-space: pre-wrap; word-break: break-word; margin: 0; line-height: 1.6; }
        .quete-detail-comps { background: rgba(111,66,193,0.1); border: 1px solid #6f42c1; border-radius: 8px; padding: 10px 12px; margin: 10px 0; }
        .quete-detail-comps-label { font-size: 0.75rem; color: #a78bfa; }
        .quete-detail-comp-badge { background: #6f42c1; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }
        .quete-comps-preview { font-size: 0.75rem; color: #a78bfa; }
        .quete-card-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(74,222,128,0.2); gap: 8px; }
        .quetes-vide { text-align: center; color: #666; padding: 40px; font-size: 0.9rem; }
        .soumission-form { margin-top: 14px; }
        .soumission-form h3 { font-size: 0.9rem; color: #a78bfa; margin-bottom: 8px; }
        .soumission-form textarea { width: 100%; background: #07071a; border: 1px solid #444; border-radius: 8px; color: white; padding: 10px; font-family: inherit; font-size: 0.85rem; resize: vertical; margin-bottom: 8px; box-sizing: border-box; }
        .feedback-box { border-radius: 8px; padding: 10px 12px; margin: 10px 0; font-size: 0.85rem; }
        .feedback-box.success { background: rgba(22,163,74,0.15); border: 1px solid #16a34a; color: #4ade80; }
        .feedback-box.error   { background: rgba(220,38,38,0.15); border: 1px solid #dc2626; color: #f87171; }
        .xp-earned { font-weight: 700; color: #fde047; }
        .attente-box { background: rgba(202,138,4,0.15); border: 1px solid #ca8a04; color: #fde047; border-radius: 8px; padding: 12px; font-size: 0.85rem; margin-top: 12px; }
        .valide-box  { background: rgba(22,163,74,0.15); border: 1px solid #16a34a; color: #4ade80; border-radius: 8px; padding: 12px; font-size: 0.85rem; margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }

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