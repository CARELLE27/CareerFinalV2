import React, { useState, useEffect } from 'react';
import { getProfil, getMesCompetences, getCompetences, updateProfil, getMesQuetes } from '../services/api';
import Avatar from '../components/Avatar';
import GithubModal from '../components/GithubModal';
import QuestePath from '../components/QuestePath';

const AVATAR_LABELS = {
  etudiant: '🧑‍💻 Étudiant',
  junior:   '👨‍🔬 Junior Dev',
  senior:   '🧙‍♂️ Senior Dev',
  expert:   '🦸 Expert',
};

function getNextAvatar(points) {
  return [
    { type: 'junior', label: 'Junior Dev', minXP: 500  },
    { type: 'senior', label: 'Senior Dev', minXP: 1500 },
    { type: 'expert', label: 'Expert',     minXP: 3000 },
  ].find(a => a.minXP > points) || null;
}

export default function Profil() {
  const [user, setUser]               = useState(null);
  const [competences, setCompetences] = useState([]);
  const [mesComps, setMesComps]       = useState([]);
  const [quetes, setQuetes]           = useState([]);
  const [message, setMessage]         = useState('');
  const [editMode, setEditMode]       = useState(false);
  const [showGithub, setShowGithub]   = useState(false);  // ✅ Modal GitHub
  const [editForm, setEditForm]       = useState({ ecole: '', bio: '' });
  const [viewMode, setViewMode]       = useState('arbre'); // 'arbre' | 'chemin'

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
    } catch { setMessage('❌ Erreur lors de la mise à jour'); }
  };

  if (!user) return <div className="loading">Chargement...</div>;

  const mesCompIds   = mesComps.map(mc => mc.competence?.id);
  const categories   = [...new Set(competences.map(c => c.categorie))];
  const progression  = user.points % 100;
  const xpRestant    = 100 - progression;
  const nextAvatar   = getNextAvatar(user.points);
  const xpNextAvatar = nextAvatar ? nextAvatar.minXP - user.points : null;
  const filieres     = Array.isArray(user.filieres) ? user.filieres : [];

  return (
    <div className="page">
      <h1>👤 Mon Profil</h1>
      {message && <div className="toast">{message}</div>}

      {/* ✅ Modal GitHub */}
      {showGithub && (
        <GithubModal
          onClose={() => setShowGithub(false)}
          onSuccess={reloadUser}
          githubUsername={user.github_username}
        />
      )}

      {/* ══ EN-TÊTE ══ */}
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
            {user.github_username && (
              <span className="hero-tag github">🐙 {user.github_username}</span>
            )}
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

        {/* Boutons */}
        <div className="profil-actions">
          <button className="btn-edit" onClick={() => setEditMode(!editMode)}>
            {editMode ? '✕ Annuler' : '✏️ Modifier'}
          </button>
          <button className="btn-github-toggle" onClick={() => setShowGithub(true)}>
            🐙 {user.github_username ? 'GitHub connecté' : 'Connecter GitHub'}
          </button>
        </div>
      </div>

      {/* Formulaire modification */}
      {editMode && (
        <form className="edit-form" onSubmit={handleSaveEdit}>
          <h3>✏️ Modifier mon profil</h3>
          <div className="edit-row">
            <div className="edit-field">
              <label>École</label>
              <input type="text" value={editForm.ecole}
                onChange={e => setEditForm(f => ({ ...f, ecole: e.target.value }))}
                placeholder="Votre école..." />
            </div>
            <div className="edit-field">
              <label>Bio</label>
              <input type="text" value={editForm.bio}
                onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Quelques mots sur vous..." />
            </div>
          </div>
          <button type="submit" className="btn-save">Sauvegarder</button>
        </form>
      )}

      {/* ══ COMPÉTENCES + QUÊTES avec toggle ══ */}
      <section className="section">
        <div className="section-toggle-header">
          <div>
            <h2>🧠 Mes Compétences & Quêtes</h2>
          </div>
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'arbre' ? 'active' : ''}`}
              onClick={() => setViewMode('arbre')}
            >
              🧠 Arbre
            </button>
            <button
              className={`toggle-btn ${viewMode === 'chemin' ? 'active' : ''}`}
              onClick={() => setViewMode('chemin')}
            >
              🗺️ Chemin RPG
            </button>
          </div>
        </div>

        {/* ── VUE ARBRE ── */}
        {viewMode === 'arbre' && (
          <>
            <div className="comp-legende">
              <span className="comp-badge owned" style={{ cursor: 'default' }}>✅ Débloquée</span>
              <span className="comp-badge locked" style={{ cursor: 'default' }}>🔒 Via quête</span>
              <p className="comp-legende-text">
                Se débloquent automatiquement en validant les quêtes.
                {filieres.length > 0 && <> Pour : <strong>{filieres.join(', ')}</strong></>}
              </p>
            </div>
            {categories.map(cat => {
              const compsCateg = competences.filter(c => c.categorie === cat);
              if (compsCateg.length === 0) return null;
              return (
                <div key={cat} className="comp-category">
                  <h3 className="comp-cat-title">{cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
                  <div className="competences-grid">
                    {compsCateg.map(c => {
                      const owned = mesCompIds.includes(c.id);
                      return (
                        <div key={c.id} className={`comp-badge ${owned ? 'owned' : 'locked'}`}
                          title={owned ? '✅ Débloquée' : '🔒 Complétez une quête'}>
                          {owned ? '✅ ' : '🔒 '}{c.nom}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ── VUE CHEMIN RPG ── */}
        {viewMode === 'chemin' && (
          <QuestePath quetes={quetes} />
        )}
      </section>

      <style>{`
        .profil-hero {
          background: linear-gradient(135deg, #1a1a40, #2d1060);
          border: 1px solid #6f42c1; border-radius: 16px;
          padding: 24px; display: flex; align-items: flex-start;
          gap: 20px; margin-bottom: 20px; flex-wrap: wrap;
        }
        .profil-hero-info { flex: 1; min-width: 200px; }
        .profil-hero-info h2 { font-size: 1.5rem; font-weight: 700; color: #e0e0f0; margin-bottom: 4px; }
        .profil-bio { font-size: 0.85rem; color: #888; font-style: italic; margin-bottom: 8px; }
        .profil-actions { display: flex; flex-direction: column; gap: 8px; align-self: flex-start; }
        .btn-edit { background: transparent; border: 1px solid #6f42c1; color: #a78bfa; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 0.82rem; transition: all 0.2s; white-space: nowrap; }
        .btn-edit:hover { background: #6f42c1; color: white; }
        .btn-github-toggle { background: transparent; border: 1px solid #0077b5; color: #38bdf8; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 0.82rem; transition: all 0.2s; white-space: nowrap; }
        .btn-github-toggle:hover { background: rgba(0,119,181,0.2); }
        .hero-level-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .hero-tag { padding: 4px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 700; }
        .hero-tag.avatar-tag { background: rgba(111,66,193,0.2); color: #a78bfa; border: 1px solid #6f42c1; }
        .hero-tag.niveau     { background: rgba(236,72,153,0.2); color: #f472b6; border: 1px solid #ec4899; }
        .hero-tag.ecole      { background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid #0ea5e9; }
        .hero-tag.filiere    { background: rgba(111,66,193,0.15); color: #a78bfa; border: 1px solid #6f42c1; }
        .hero-tag.github     { background: rgba(0,119,181,0.1); color: #38bdf8; border: 1px solid #0077b5; }
        .profil-xp-bar-wrap  { margin-bottom: 10px; }
        .profil-xp-bar-bg    { background: #333; border-radius: 6px; height: 8px; overflow: hidden; margin-bottom: 4px; }
        .profil-xp-bar-fill  { background: linear-gradient(90deg, #7c3aed, #a78bfa); height: 100%; border-radius: 6px; transition: width 0.4s ease; }
        .profil-xp-label     { font-size: 0.78rem; color: #888; }
        .next-avatar-info    { background: rgba(253,224,71,0.08); border: 1px solid rgba(253,224,71,0.3); border-radius: 8px; padding: 8px 12px; font-size: 0.82rem; color: #fde047; margin-top: 8px; }
        .edit-form  { background: #1a1a2e; border: 1px solid #2a1a5e; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
        .edit-form h3 { color: #a78bfa; margin-bottom: 14px; font-size: 0.95rem; }
        .edit-row   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .edit-field label { display: block; font-size: 0.78rem; color: #a78bfa; margin-bottom: 5px; }
        .edit-field input { width: 100%; padding: 8px 10px; background: #07071a; border: 1px solid #444; border-radius: 7px; color: white; font-size: 0.85rem; box-sizing: border-box; }
        .btn-save   { background: #7c3aed; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 700; }
        .section-toggle-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .view-toggle { display: flex; gap: 6px; }
        .toggle-btn { background: #1a1a2e; border: 1px solid #333; color: #888; padding: 6px 14px; border-radius: 8px; cursor: pointer; font-size: 0.8rem; transition: all 0.2s; }
        .toggle-btn:hover  { border-color: #6f42c1; color: #a78bfa; }
        .toggle-btn.active { background: #7c3aed; border-color: #7c3aed; color: white; }
        .comp-legende { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; padding: 10px 14px; background: rgba(111,66,193,0.08); border-radius: 8px; border: 1px solid #2a1a5e; }
        .comp-legende-text { font-size: 0.78rem; color: #888; width: 100%; margin-top: 4px; }
        @media (max-width: 700px) { .profil-hero { flex-direction: column; } .profil-actions { flex-direction: row; } .edit-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}