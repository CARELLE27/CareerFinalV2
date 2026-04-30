import React, { useState, useEffect } from 'react';
import { getProfil, getMesCompetences, getCompetences, connectGithub, updateProfil, getFilieres } from '../services/api';

export default function Profil() {
  const [user, setUser]               = useState(null);
  const [competences, setCompetences] = useState([]);
  const [mesComps, setMesComps]       = useState([]);
  const [githubUser, setGithubUser]   = useState('');
  const [githubRepos, setGithubRepos] = useState([]);
  const [message, setMessage]         = useState('');
  const [filieres, setFilieres]       = useState([]);
  const [editMode, setEditMode]       = useState(false);
  const [editForm, setEditForm]       = useState({ ecole: '', bio: '' });

  useEffect(() => {
    getProfil().then(r => {
      setUser(r.data);
      setGithubUser(r.data.github_username || '');
      setEditForm({ ecole: r.data.ecole || '', bio: r.data.bio || '' });
    }).catch(() => {});
    getCompetences().then(r => setCompetences(r.data)).catch(() => {});
    getMesCompetences().then(r => setMesComps(r.data)).catch(() => {});
    getFilieres().then(r => setFilieres(r.data)).catch(() => {});
  }, []);

  const handleGithub = async (e) => {
    e.preventDefault();
    try {
      const res = await connectGithub(githubUser);
      setGithubRepos(res.data.repos);
      setMessage(res.data.message);
      getProfil().then(r => setUser(r.data));
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Impossible de charger GitHub'); }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await updateProfil(editForm);
      getProfil().then(r => setUser(r.data));
      setEditMode(false);
      setMessage('Profil mis à jour ✅');
      setTimeout(() => setMessage(''), 2000);
    } catch { setMessage('Erreur lors de la mise à jour'); }
  };

  if (!user) return <div className="loading">Chargement...</div>;

  const mesCompIds = mesComps.map(mc => mc.competence.id);
  const categories = [...new Set(competences.map(c => c.categorie))];

  return (
    <div className="page">
      <h1>👤 Mon Profil</h1>
      {message && <div className="toast">{message}</div>}

      {/* Header profil */}
      <div className="profil-header">
        <div className="profil-header-main">
          <div>
            <h2>{user.username}</h2>
            <p className="profil-sub">Niveau {user.level} • {user.points} XP</p>

            {/* École et filière */}
            <div className="profil-tags">
              {user.ecole && (
                <span className="profil-tag ecole">🏫 {user.ecole}</span>
              )}
              <span className="profil-tag filiere">
                {user.filiere_label}
              </span>
              {user.github_username && (
                <span className="profil-tag github">🐙 {user.github_username}</span>
              )}
            </div>
          </div>
          <button
            className="btn-edit"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? '✕ Annuler' : '✏️ Modifier'}
          </button>
        </div>

        {/* Formulaire d'édition */}
        {editMode && (
          <form className="edit-form" onSubmit={handleSaveEdit}>
            <div className="edit-row">
              <div className="field-group">
                <label>École</label>
                <input
                  type="text"
                  value={editForm.ecole}
                  onChange={e => setEditForm(f => ({ ...f, ecole: e.target.value }))}
                  placeholder="Votre école..."
                />
              </div>
              <div className="field-group">
                <label>Bio</label>
                <input
                  type="text"
                  value={editForm.bio}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Quelques mots sur vous..."
                />
              </div>
            </div>
            <button type="submit" className="btn-save">Sauvegarder</button>
          </form>
        )}
      </div>

      {/* Arbre de compétences */}
      <section className="section">
        <h2>🧠 Arbre de Compétences</h2>
        <div className="comp-legende">
          <span className="comp-badge owned" style={{ cursor: 'default' }}>✅ Débloquée</span>
          <span className="comp-badge locked" style={{ cursor: 'default' }}>🔒 Via quête</span>
          <p className="comp-legende-text">
            Les compétences se débloquent automatiquement en validant les quêtes associées.
            Elles sont filtrées selon votre filière : <strong>{user.filiere_label}</strong>
          </p>
        </div>

        {categories.map(cat => {
          const compsCateg = competences.filter(c => c.categorie === cat);
          if (compsCateg.length === 0) return null;
          return (
            <div key={cat} className="comp-category">
              <h3 className="comp-cat-title">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </h3>
              <div className="competences-grid">
                {compsCateg.map(c => {
                  const owned = mesCompIds.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      className={`comp-badge ${owned ? 'owned' : 'locked'}`}
                      title={owned
                        ? 'Compétence débloquée ✅'
                        : 'Complétez une quête associée pour débloquer'
                      }
                    >
                      {owned ? '✅ ' : '🔒 '}{c.nom}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      {/* GitHub */}
      <section className="section">
        <h2>🐙 Connecter GitHub</h2>
        <form onSubmit={handleGithub} className="github-form">
          <input
            type="text"
            placeholder="Votre pseudo GitHub"
            value={githubUser}
            onChange={e => setGithubUser(e.target.value)}
          />
          <button type="submit" className="btn-primary">Connecter</button>
        </form>
        {githubRepos.length > 0 && (
          <div className="repos-list">
            {githubRepos.map((repo, i) => (
              <div key={i} className="repo-item">
                <span>📁 {repo.name}</span>
                <span>⭐ {repo.stargazers_count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        .profil-header-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .profil-sub { font-size: 0.9rem; color: #aaa; margin: 4px 0 8px; }
        .profil-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .profil-tag {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .profil-tag.ecole   { background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid #0ea5e9; }
        .profil-tag.filiere { background: rgba(111,66,193,0.2); color: #a78bfa; border: 1px solid #6f42c1; }
        .profil-tag.github  { background: rgba(255,255,255,0.05); color: #888; border: 1px solid #444; }
        .btn-edit {
          background: transparent;
          border: 1px solid #6f42c1;
          color: #a78bfa;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.82rem;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .btn-edit:hover { background: #6f42c1; color: white; }
        .edit-form { margin-top: 16px; padding-top: 16px; border-top: 1px solid #2a1a5e; }
        .edit-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .field-group label { display: block; font-size: 0.78rem; color: #a78bfa; margin-bottom: 5px; }
        .field-group input { width: 100%; padding: 8px 10px; background: #07071a; border: 1px solid #444; border-radius: 7px; color: white; font-size: 0.85rem; }
        .btn-save { background: #7c3aed; color: white; border: none; padding: 8px 20px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 700; }
        .comp-legende { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; padding: 10px 14px; background: rgba(111,66,193,0.08); border-radius: 8px; border: 1px solid #2a1a5e; }
        .comp-legende-text { font-size: 0.78rem; color: #888; width: 100%; margin-top: 4px; }
      `}</style>
    </div>
  );
}
