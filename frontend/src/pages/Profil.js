import React, { useState, useEffect } from 'react';
import { getProfil, getMesCompetences, getCompetences, updateProfil, getMesQuetes } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import GithubModal from '../components/GithubModal';

const AVATAR_LABELS = {
  etudiant: '🧑‍💻 Étudiant',
  junior:   '👨‍🔬 Junior Dev',
  senior:   '🧙‍♂️ Senior Dev',
  expert:   '🦸 Expert',
};

function getNextAvatar(points) {
  return [
    { label: 'Junior Dev', minXP: 500  },
    { label: 'Senior Dev', minXP: 1500 },
    { label: 'Expert',     minXP: 3000 },
  ].find(a => a.minXP > points) || null;
}

// ── GRILLE COMPÉTENCES ────────────────────────────────────
function CompetencesGrid({ competences, mesCompIds }) {
  const categories = [...new Set(competences.map(c => c.categorie))];
  return (
    <div className="comp-grid-wrap">
      {categories.map(cat => {
        const comps = competences.filter(c => c.categorie === cat);
        if (!comps.length) return null;
        return (
          <div key={cat} className="comp-grid-section">
            <div className="comp-grid-cat-label">{cat.charAt(0).toUpperCase() + cat.slice(1)}</div>
            <div className="comp-grid-row">
              {comps.map(c => {
                const owned = mesCompIds.includes(c.id);
                return (
                  <div key={c.id} className={`comp-grid-cell ${owned ? 'owned' : 'locked'}`} title={c.description || c.nom}>
                    <span className="comp-grid-icon">{owned ? '✅' : '🔒'}</span>
                    <span className="comp-grid-name">{c.nom}</span>
                    {owned && <span className="comp-grid-badge">Acquise</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── VUE PAR COMPÉTENCE ────────────────────────────────────
function VueParCompetence({ quetes, user }) {
  const navigate = useNavigate();

  const parcours = {};
  quetes.forEach(uq => {
    const comps = uq.quete.competences_debloquees || [];
    if (comps.length === 0) {
      if (!parcours['__general__']) parcours['__general__'] = { nom: '🎯 Général', quetes: [] };
      if (!parcours['__general__'].quetes.find(q => q.id === uq.id))
        parcours['__general__'].quetes.push(uq);
    } else {
      comps.forEach(c => {
        if (!parcours[c.id]) parcours[c.id] = { nom: c.nom, quetes: [] };
        if (!parcours[c.id].quetes.find(q => q.id === uq.id))
          parcours[c.id].quetes.push(uq);
      });
    }
  });
  Object.values(parcours).forEach(p => {
    p.quetes.sort((a, b) => a.quete.difficulte - b.quete.difficulte);
  });

  return (
    <div className="vpc-wrap">
      {Object.entries(parcours).map(([key, parcour]) => {
        const total     = parcour.quetes.length;
        const valides   = parcour.quetes.filter(q => q.statut === 'valide').length;
        const pct       = Math.round((valides / total) * 100);
        const prochaine = parcour.quetes.find(q => q.statut !== 'valide');
        const maitrisee = valides === total;

        return (
          <div key={key} className={`vpc-parcour ${maitrisee ? 'maitrisee' : ''}`}>

            {/* En-tête */}
            <div className="vpc-header">
              <div className="vpc-header-left">
                <span className="vpc-nom">🎓 {parcour.nom}</span>
                <span className="vpc-count">{valides}/{total}</span>
                {maitrisee && <span className="vpc-badge-maitrisee">✨ Maîtrisée !</span>}
              </div>
              <div className="vpc-bar-wrap">
                <div className="vpc-bar-bg">
                  <div className="vpc-bar-fill" style={{
                    width: `${pct}%`,
                    background: maitrisee
                      ? 'linear-gradient(90deg,#4ade80,#fde047)'
                      : 'linear-gradient(90deg,#7c3aed,#4ade80)'
                  }} />
                </div>
                <span className="vpc-pct" style={{ color: maitrisee ? '#fde047' : '#a78bfa' }}>{pct}%</span>
              </div>
            </div>

            {/* Chemin */}
            <div className="vpc-chemin">
              {parcour.quetes.map((uq, i) => {
                const estProch = prochaine?.id === uq.id;
                const done     = uq.statut === 'valide';
                const refused  = uq.statut === 'refuse';
                const waiting  = uq.statut === 'soumis';
                return (
                  <React.Fragment key={uq.id}>
                    {i > 0 && (
                      <div className={`vpc-connector ${parcour.quetes[i-1].statut === 'valide' ? 'done' : ''}`}>→</div>
                    )}
                    <div
                      className={`vpc-quete-card ${estProch ? 'prochaine' : ''} ${done ? 'done' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/quetes?id=${uq.quete.id}`)}
                      title="Aller à cette quête"
                    >
                      {estProch && !maitrisee && <div className="vpc-badge-prochaine">✈️ Suivante</div>}
                      <div className="vpc-quete-icone">{uq.quete.icone}</div>
                      <div className="vpc-quete-titre">{uq.quete.titre}</div>
                      <div className="vpc-quete-meta">
                        {'⭐'.repeat(uq.quete.difficulte)}
                        <span className="vpc-xp">+{uq.quete.points}XP</span>
                      </div>
                      <div className="vpc-quete-statut">
                        {done    ? '✅ Validée'    : ''}
                        {refused ? '❌ Refusée'    : ''}
                        {waiting ? '⏳ En attente' : ''}
                        {!done && !refused && !waiting && estProch  ? '✈️ À faire'  : ''}
                        {!done && !refused && !waiting && !estProch ? '🔒 Bloquée'  : ''}
                      </div>
                      {/* Lien vers quêtes */}
                      <div style={{
                        fontSize: '0.65rem', color: '#6f42c1',
                        marginTop: '6px', borderTop: '1px solid #2a1a5e',
                        paddingTop: '4px'
                      }}>
                        → Aller à la quête
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* RÉCOMPENSE FINALE */}
              <div className="vpc-connector done">→</div>
              <div className={`vpc-reward ${maitrisee ? 'unlocked' : ''}`}>
                <span className="vpc-reward-trophy">{maitrisee ? '🏆' : '🔒'}</span>
                <span className="vpc-reward-nom">{parcour.nom}</span>
                <span className="vpc-reward-label">
                  {maitrisee ? 'Maîtrisée !' : `${valides}/${total} quêtes`}
                </span>

                {/* ✅ Bouton LinkedIn — actif si maîtrisée, grisé sinon */}
                {key !== '__general__' && (
                  <button
                    disabled={!maitrisee}
                    title={maitrisee ? 'Partager sur LinkedIn' : `Validez toutes les quêtes pour partager`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      justifyContent: 'center', width: '100%',
                      padding: '7px 10px', marginTop: '8px',
                      background: maitrisee ? '#0077B5' : '#1a1a2e',
                      color: maitrisee ? 'white' : '#444',
                      border: maitrisee ? '1px solid #0077B5' : '1px solid #333',
                      borderRadius: '8px', fontSize: '0.68rem', fontWeight: 700,
                      cursor: maitrisee ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit', transition: 'all 0.2s',
                    }}
                    onClick={() => {
                      if (!maitrisee) return;
                      const texte = `🎮 J'ai maîtrisé la compétence "${parcour.nom}" sur CareerQuest !\n\nToutes les quêtes validées. Niveau ${user?.level} atteint 🚀\n\n#CareerQuest #${parcour.nom.replace(/[\s\/\-]/g, '')} #Formation`;
                      window.open(
                        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://careerquest.app')}&summary=${encodeURIComponent(texte)}`,
                        '_blank', 'width=600,height=600'
                      );
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    {maitrisee ? 'Partager sur LinkedIn' : '🔒 Partager sur LinkedIn'}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── COMPOSANT PRINCIPAL ───────────────────────────────────
export default function Profil() {
  const [user, setUser]               = useState(null);
  const [competences, setCompetences] = useState([]);
  const [mesComps, setMesComps]       = useState([]);
  const [quetes, setQuetes]           = useState([]);
  const [message, setMessage]         = useState('');
  const [editMode, setEditMode]       = useState(false);
  const [showGithub, setShowGithub]   = useState(false);
  const [editForm, setEditForm]       = useState({ ecole: '', bio: '' });
  const [viewMode, setViewMode]       = useState('grille');

  const reloadUser = () => getProfil().then(r => {
    setUser(r.data);
    setEditForm({ ecole: r.data.ecole || '', bio: r.data.bio || '' });
  }).catch(() => {});

  useEffect(() => {
    reloadUser();
    getCompetences().then(r => setCompetences(r.data)).catch(() => {});
    getMesCompetences().then(r => setMesComps(r.data)).catch(() => {});
    getMesQuetes().then(r => setQuetes(r.data)).catch(() => {});
  }, []);

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateProfil(editForm);
      reloadUser();
      setEditMode(false);
      setMessage('✅ Profil mis à jour !');
      setTimeout(() => setMessage(''), 2000);
    } catch { setMessage('❌ Erreur'); }
  };

  if (!user) return <div className="loading">Chargement...</div>;

  const mesCompIds   = mesComps.map(mc => mc.competence?.id);
  const progression  = user.points % 100;
  const xpRestant    = 100 - progression;
  const nextAvatar   = getNextAvatar(user.points);
  const xpNextAvatar = nextAvatar ? nextAvatar.minXP - user.points : null;
  const filieres     = Array.isArray(user.filieres) ? user.filieres : [];

  return (
    <div className="page">
      <h1>👤 Mon Profil</h1>
      {message && <div className="toast">{message}</div>}

      {showGithub && (
        <GithubModal onClose={() => setShowGithub(false)} onSuccess={reloadUser} githubUsername={user.github_username} />
      )}

      {/* ── EN-TÊTE ── */}
      <div className="profil-hero">
        <Avatar type={user.avatar} level={user.level} />
        <div className="profil-hero-info">
          <h2>{user.username}</h2>
          {user.bio && <p className="profil-bio">{user.bio}</p>}
          <div className="hero-level-row">
            <span className="hero-tag avatar-tag">{AVATAR_LABELS[user.avatar] || '🧑‍💻 Étudiant'}</span>
            <span className="hero-tag niveau">Niveau {user.level}</span>
            {user.ecole && <span className="hero-tag ecole">🏫 {user.ecole}</span>}
            {filieres.map((f, i) => <span key={i} className="hero-tag filiere">{f}</span>)}
            {user.github_username && <span className="hero-tag github">🐙 {user.github_username}</span>}
          </div>
          <div className="profil-xp-bar-wrap">
            <div className="profil-xp-bar-bg">
              <div className="profil-xp-bar-fill" style={{ width: `${progression}%` }} />
            </div>
            <span className="profil-xp-label">
              {user.points} XP — encore {xpRestant} XP pour le niveau {user.level + 1}
            </span>
          </div>
          {xpNextAvatar !== null && (
            <div className="next-avatar-info">
              🎯 Il vous reste <strong>{xpNextAvatar} XP</strong> pour devenir <strong>{nextAvatar.label}</strong>
            </div>
          )}
        </div>
        <div className="profil-actions">
          <button className="btn-edit" onClick={() => setEditMode(!editMode)}>
            {editMode ? '✕ Annuler' : '✏️ Modifier'}
          </button>
          <button className="btn-github-toggle" onClick={() => setShowGithub(true)}>
            🐙 {user.github_username ? 'GitHub connecté' : 'Connecter GitHub'}
          </button>
        </div>
      </div>

      {editMode && (
        <form className="edit-form" onSubmit={handleSaveEdit}>
          <h3>✏️ Modifier</h3>
          <div className="edit-row">
            <div className="edit-field">
              <label>École</label>
              <input type="text" value={editForm.ecole} onChange={e => setEditForm(f => ({ ...f, ecole: e.target.value }))} placeholder="Votre école..." />
            </div>
            <div className="edit-field">
              <label>Bio</label>
              <input type="text" value={editForm.bio} onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))} placeholder="Quelques mots..." />
            </div>
          </div>
          <button type="submit" className="btn-save">Sauvegarder</button>
        </form>
      )}

      {/* ── SECTION ── */}
      <section className="section">
        <div className="section-toggle-header">
          <h2>🧠 Compétences & Progression</h2>
          <div className="view-toggle">
            <button className={`toggle-btn ${viewMode === 'grille' ? 'active' : ''}`} onClick={() => setViewMode('grille')}>
              📊 Tableau
            </button>
            <button className={`toggle-btn ${viewMode === 'parcours' ? 'active' : ''}`} onClick={() => setViewMode('parcours')}>
              🎓 Par compétence
            </button>
          </div>
        </div>

        {viewMode === 'grille' && (
          <>
            <div className="comp-legende">
              <span className="comp-badge owned" style={{ cursor: 'default' }}>✅ Débloquée</span>
              <span className="comp-badge locked" style={{ cursor: 'default' }}>🔒 Via quête</span>
              <p className="comp-legende-text">Se débloquent automatiquement en validant les quêtes.
                {filieres.length > 0 && <> Pour : <strong>{filieres.join(', ')}</strong></>}
              </p>
            </div>
            <CompetencesGrid competences={competences} mesCompIds={mesCompIds} />
          </>
        )}

        {viewMode === 'parcours' && (
          <VueParCompetence quetes={quetes} user={user} />
        )}
      </section>

      <style>{`
        .profil-hero { background:linear-gradient(135deg,#1a1a40,#2d1060); border:1px solid #6f42c1; border-radius:16px; padding:24px; display:flex; align-items:flex-start; gap:20px; margin-bottom:20px; flex-wrap:wrap; }
        .profil-hero-info { flex:1; min-width:200px; }
        .profil-hero-info h2 { font-size:1.5rem; font-weight:700; color:#e0e0f0; margin-bottom:4px; }
        .profil-bio { font-size:0.85rem; color:#888; font-style:italic; margin-bottom:8px; }
        .profil-actions { display:flex; flex-direction:column; gap:8px; align-self:flex-start; }
        .btn-edit { background:transparent; border:1px solid #6f42c1; color:#a78bfa; padding:6px 14px; border-radius:8px; cursor:pointer; font-size:0.82rem; transition:all 0.2s; white-space:nowrap; }
        .btn-edit:hover { background:#6f42c1; color:white; }
        .btn-github-toggle { background:transparent; border:1px solid #0077b5; color:#38bdf8; padding:6px 14px; border-radius:8px; cursor:pointer; font-size:0.82rem; transition:all 0.2s; white-space:nowrap; }
        .btn-github-toggle:hover { background:rgba(0,119,181,0.2); }
        .hero-level-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
        .hero-tag { padding:4px 12px; border-radius:20px; font-size:0.78rem; font-weight:700; }
        .hero-tag.avatar-tag { background:rgba(111,66,193,0.2); color:#a78bfa; border:1px solid #6f42c1; }
        .hero-tag.niveau     { background:rgba(236,72,153,0.2); color:#f472b6; border:1px solid #ec4899; }
        .hero-tag.ecole      { background:rgba(14,165,233,0.15); color:#38bdf8; border:1px solid #0ea5e9; }
        .hero-tag.filiere    { background:rgba(111,66,193,0.15); color:#a78bfa; border:1px solid #6f42c1; }
        .hero-tag.github     { background:rgba(0,119,181,0.1); color:#38bdf8; border:1px solid #0077b5; }
        .profil-xp-bar-wrap { margin-bottom:10px; }
        .profil-xp-bar-bg   { background:#333; border-radius:6px; height:8px; overflow:hidden; margin-bottom:4px; }
        .profil-xp-bar-fill { background:linear-gradient(90deg,#7c3aed,#a78bfa); height:100%; border-radius:6px; transition:width 0.4s ease; }
        .profil-xp-label    { font-size:0.78rem; color:#888; }
        .next-avatar-info   { background:rgba(253,224,71,0.08); border:1px solid rgba(253,224,71,0.3); border-radius:8px; padding:8px 12px; font-size:0.82rem; color:#fde047; margin-top:8px; }
        .edit-form  { background:#1a1a2e; border:1px solid #2a1a5e; border-radius:12px; padding:16px; margin-bottom:20px; }
        .edit-form h3 { color:#a78bfa; margin-bottom:12px; font-size:0.95rem; }
        .edit-row   { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
        .edit-field label { display:block; font-size:0.78rem; color:#a78bfa; margin-bottom:5px; }
        .edit-field input { width:100%; padding:8px 10px; background:#07071a; border:1px solid #444; border-radius:7px; color:white; font-size:0.85rem; box-sizing:border-box; }
        .btn-save { background:#7c3aed; color:white; border:none; padding:8px 20px; border-radius:8px; cursor:pointer; font-size:0.85rem; font-weight:700; }
        .section-toggle-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px; }
        .view-toggle { display:flex; gap:6px; }
        .toggle-btn { background:#1a1a2e; border:1px solid #333; color:#888; padding:6px 14px; border-radius:8px; cursor:pointer; font-size:0.8rem; transition:all 0.2s; }
        .toggle-btn:hover  { border-color:#6f42c1; color:#a78bfa; }
        .toggle-btn.active { background:#7c3aed; border-color:#7c3aed; color:white; }
        .comp-legende { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:16px; padding:10px 14px; background:rgba(111,66,193,0.08); border-radius:8px; border:1px solid #2a1a5e; }
        .comp-legende-text { font-size:0.78rem; color:#888; width:100%; margin-top:4px; }
        .comp-grid-wrap { display:flex; flex-direction:column; gap:16px; }
        .comp-grid-cat-label { font-size:0.72rem; font-weight:700; color:#a78bfa; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
        .comp-grid-row { display:flex; flex-wrap:wrap; gap:8px; }
        .comp-grid-cell { display:flex; flex-direction:column; align-items:center; justify-content:center; width:100px; min-height:80px; padding:8px; border-radius:10px; border:1px solid; transition:all 0.2s; text-align:center; }
        .comp-grid-cell.owned  { background:rgba(22,163,74,0.1); border-color:#16a34a; }
        .comp-grid-cell.locked { background:#1a1a2e; border-color:#2a2a2e; }
        .comp-grid-cell:hover  { transform:translateY(-2px); }
        .comp-grid-icon  { font-size:1.3rem; margin-bottom:4px; }
        .comp-grid-name  { font-size:0.65rem; font-weight:600; color:#e0e0f0; line-height:1.2; }
        .comp-grid-badge { font-size:0.55rem; color:#4ade80; margin-top:3px; font-weight:700; }

        /* VUE PAR COMPÉTENCE */
        .vpc-wrap { display:flex; flex-direction:column; gap:20px; }
        .vpc-parcour { background:#0d0d2b; border:1px solid #2a1a5e; border-radius:14px; padding:16px; transition:all 0.3s; }
        .vpc-parcour.maitrisee { border-color:#fde047; background:rgba(253,224,71,0.03); box-shadow:0 0 20px rgba(253,224,71,0.1); }
        .vpc-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px; }
        .vpc-header-left { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .vpc-nom { font-size:0.95rem; font-weight:700; color:#a78bfa; }
        .vpc-count { font-size:0.75rem; color:#888; background:#1a1a2e; padding:2px 8px; border-radius:10px; }
        .vpc-badge-maitrisee { background:rgba(253,224,71,0.15); border:1px solid #fde047; color:#fde047; font-size:0.7rem; font-weight:700; padding:2px 10px; border-radius:10px; animation:glow-gold 1.5s ease infinite alternate; }
        .vpc-bar-wrap { display:flex; align-items:center; gap:8px; flex:1; max-width:200px; }
        .vpc-bar-bg { flex:1; background:#1a1a2e; border-radius:4px; height:6px; overflow:hidden; }
        .vpc-bar-fill { height:100%; border-radius:4px; transition:width 0.4s ease; }
        .vpc-pct { font-size:0.72rem; font-weight:700; }
        .vpc-chemin { display:flex; align-items:center; gap:0; overflow-x:auto; padding:10px 0 14px; }
        .vpc-chemin::-webkit-scrollbar { height:4px; }
        .vpc-chemin::-webkit-scrollbar-thumb { background:#6f42c1; border-radius:4px; }
        .vpc-connector { color:#444; font-size:1.2rem; padding:0 6px; flex-shrink:0; }
        .vpc-connector.done { color:#4ade80; }
        .vpc-quete-card { position:relative; background:#1a1a2e; border:1.5px solid #2a2a4e; border-radius:10px; padding:10px 12px; min-width:150px; max-width:180px; flex-shrink:0; text-align:center; transition:all 0.2s; }
        .vpc-quete-card.done     { border-color:#16a34a; background:rgba(22,163,74,0.08); }
        .vpc-quete-card.prochaine { border-color:#fde047; box-shadow:0 0 12px rgba(253,224,71,0.25); }
        .vpc-badge-prochaine { position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:#fde047; color:#000; font-size:0.6rem; font-weight:700; padding:2px 8px; border-radius:10px; white-space:nowrap; }
        .vpc-quete-icone { font-size:1.4rem; margin-bottom:4px; }
        .vpc-quete-titre { font-size:0.72rem; font-weight:700; color:#e0e0f0; line-height:1.3; margin-bottom:4px; }
        .vpc-quete-meta { font-size:0.65rem; color:#888; display:flex; gap:6px; justify-content:center; margin-bottom:4px; }
        .vpc-xp { color:#a78bfa !important; font-weight:700; }
        .vpc-quete-statut { font-size:0.68rem; font-weight:700; color:#888; }

        /* Récompense finale */
        .vpc-reward { display:flex; flex-direction:column; align-items:center; justify-content:center; background:#1a1a2e; border:1.5px dashed #333; border-radius:10px; padding:12px 14px; min-width:110px; flex-shrink:0; text-align:center; gap:4px; }
        .vpc-reward-trophy { font-size:1.8rem; }
        .vpc-reward-nom    { font-size:0.72rem; color:#a78bfa; font-weight:700; }
        .vpc-reward-label  { font-size:0.62rem; color:#888; }
        .vpc-reward.unlocked { border-color:#fde047; border-style:solid; background:rgba(253,224,71,0.06); animation:glow-gold 1.5s ease infinite alternate; }
        .vpc-reward.unlocked .vpc-reward-nom   { color:#fde047; }
        .vpc-reward.unlocked .vpc-reward-label { color:#fde047; }

        /* ✅ Bouton LinkedIn compétence maîtrisée */
        .linkedin-comp-btn {
          display: flex; align-items: center; gap: 6px; justify-content: center;
          background: #0077b5; color: white; border: none;
          padding: 6px 12px; border-radius: 8px; cursor: pointer;
          font-size: 0.72rem; font-weight: 700; width: 100%;
          margin-top: 6px; transition: all 0.2s;
        }
        .linkedin-comp-btn:hover { background: #005885; transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0,119,181,0.4); }

        @keyframes glow-gold { from { box-shadow:0 0 6px rgba(253,224,71,0.2); } to { box-shadow:0 0 20px rgba(253,224,71,0.5); } }
        @media (max-width:700px) { .profil-hero { flex-direction:column; } .edit-row { grid-template-columns:1fr; } .profil-actions { flex-direction:row; } }
      `}</style>
    </div>
  );
}