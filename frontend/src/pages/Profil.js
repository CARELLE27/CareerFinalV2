import React, { useState, useEffect } from 'react';
import { getProfil, getMesCompetences, getCompetences, connectGithub, updateProfil, getFilieres } from '../services/api';
import Avatar from '../components/Avatar';
import ProgressBar from '../components/ProgressBar';

//ADD PROFIL
const AVATAR_LEVELS = [
  { type: 'etudiant', label: 'Étudiant',   minLevel: 1,  minXP: 0    },
  { type: 'junior',   label: 'Junior Dev',  minLevel: 6,  minXP: 500  },
  { type: 'senior',   label: 'Senior Dev',  minLevel: 16, minXP: 1500 },
  { type: 'expert',   label: 'Expert',      minLevel: 31, minXP: 3000 },
];

function getNextAvatar(points) {
  const next = AVATAR_LEVELS.find(a => a.minXP > points);
  return next || null;
}

  if (!user) return <div className="loading">Chargement...</div>;

  const validees    = quetes.filter(q => q.statut === 'valide');
  const enAttente   = quetes.filter(q => q.statut === 'soumis');
  const progression = user.points % 100;
  const xpProchainniveau = 100 - progression;
  const nextAvatar  = getNextAvatar(user.points);
  const xpProchainAvatar = nextAvatar ? nextAvatar.minXP - user.points : null;

  const quetesFiltrees = [
    ...quetes.filter(q => q.recommandee && q.statut !== 'valide'),
    ...quetes.filter(q => !q.recommandee && q.statut !== 'valide'),
    ...quetes.filter(q => q.statut === 'valide'),
  ].slice(0, 4);

  // Filières (peut être un tableau)
  const filieres = Array.isArray(user.filieres)
    ? user.filieres
    : (user.filiere_label ? [user.filiere_label] : []);
//


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

      {/* ✅ Header avec avatar à côté du nom */}
      <div className="profil-header">
        <div className="profil-header-main">

          {/* Avatar */}
          <div className="profil-avatar-section">
            <Avatar type={user.avatar} level={user.level} />
          </div>

          {/* Infos */}
          <div className="profil-infos">
            <h2>{user.username}</h2>
            <p className="profil-sub">Niveau {user.level} • {user.points} XP</p>
            {user.bio && <p className="profil-bio">{user.bio}</p>}

            {/* Tags école et filière */}
            <div className="profil-tags">
              {user.ecole && (
                <span className="profil-tag ecole">🏫 {user.ecole}</span>
              )}
              {user.filiere_label && (
                <span className="profil-tag filiere">{user.filiere_label}</span>
              )}
              {user.github_username && (
                <span className="profil-tag github">🐙 {user.github_username}</span>
              )}
            </div>

            {/* PLUS ADD INFO  */}
               {/* ✅ École + Niveau + Avatar sur la même ligne */}
            <div className="hero-level-row">
               <span className="avatar-title-badge">{
                user.avatar === 'etudiant' ? '🧑‍💻 Étudiant'
                : user.avatar === 'junior' ? '👨‍🔬 Junior Dev'
                : user.avatar === 'senior' ? '🧙‍♂️ Senior Dev'
                : '🦸 Expert'
              }</span>
             <span className="hero-tag niveau">Niveau {user.level}</span>
                {/* Filtres filière */}
              {filieres.map((f, i) => (
                <span key={i} className="hero-tag filiere">{f}</span>
              ))}
               {user.ecole && <span className="hero-tag ecole">🏫 {user.ecole}</span>}
            </div>
            
                      {/* Barre XP vers prochain niveau */}
                      <ProgressBar
                        value={progression}
                        max={100}
                        label={`${progression}/100 XP — encore ${xpProchainniveau} XP pour le niveau ${user.level + 1}`}
                      />
            
                      {/* XP restants pour le prochain avatar */}
                      {xpProchainAvatar !== null && (
                        <div className="next-avatar-info">
                          🎯 Il vous reste <strong>{xpProchainAvatar} XP</strong> pour devenir{' '}
                          <strong>{nextAvatar.label}</strong>
                          {nextAvatar.type === 'junior'  && ' 👨‍🔬'}
                          {nextAvatar.type === 'senior'  && ' 🧙‍♂️'}
                          {nextAvatar.type === 'expert'  && ' 🦸'}
                        </div>
                      )}
            
                      <div className="stats-row">
                        <div className="stat clickable" onClick={() => navigate('/profil')}>
                          <span className="stat-value">{user.points}</span>
                          <span className="stat-label">XP Total</span>
                        </div>
                        <div className="stat clickable" onClick={() => navigate('/quetes')}>
                          <span className="stat-value">{validees.length}</span>
                          <span className="stat-label">Quêtes validées</span>
                        </div>
                        <div className="stat clickable" onClick={() => navigate('/quetes')}>
                          <span className="stat-value">{enAttente.length}</span>
                          <span className="stat-label">En attente</span>
                        </div>
                        <div className="stat clickable" onClick={() => navigate('/classement')}>
                          <span className="stat-value">{user.level}</span>
                          <span className="stat-label">Niveau</span>
                        </div>
                      </div>
                    {/* PLUS ADD INFO  */}


          </div>

          {/* Bouton modifier */}
          <button className="btn-edit" onClick={() => setEditMode(!editMode)}>
            {editMode ? '✕ Annuler' : '✏️ Modifier'}
          </button>
        </div>

        {/* Formulaire d'édition */}
        {editMode && (
          <form className="edit-form" onSubmit={handleSaveEdit}>
            <div className="edit-row">
              <div className="edit-field">
                <label>École</label>
                <input
                  type="text"
                  value={editForm.ecole}
                  onChange={e => setEditForm(f => ({ ...f, ecole: e.target.value }))}
                  placeholder="Votre école..."
                />
              </div>
              <div className="edit-field">
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
            Compétences filtrées pour votre filière :
            <strong> {user.filiere_label}</strong>.
            Elles se débloquent automatiquement en validant les quêtes associées.
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
          align-items: center;
          gap: 20px;
        }
        .profil-avatar-section {
          flex-shrink: 0;
        }
        .profil-infos {
          flex: 1;
        }
        .profil-infos h2 {
          font-size: 1.4rem;
          margin-bottom: 3px;
        }
        .profil-sub {
          font-size: 0.9rem;
          color: #aaa;
          margin-bottom: 4px;
        }
        .profil-bio {
          font-size: 0.85rem;
          color: #888;
          margin-bottom: 6px;
          font-style: italic;
        }
        .profil-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 8px;
        }
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
          align-self: flex-start;
        }
        .btn-edit:hover { background: #6f42c1; color: white; }
        .edit-form {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #2a1a5e;
        }
        .edit-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }
        .edit-field label {
          display: block;
          font-size: 0.78rem;
          color: #a78bfa;
          margin-bottom: 5px;
        }
        .edit-field input {
          width: 100%;
          padding: 8px 10px;
          background: #07071a;
          border: 1px solid #444;
          border-radius: 7px;
          color: white;
          font-size: 0.85rem;
        }
        .btn-save {
          background: #7c3aed;
          color: white;
          border: none;
          padding: 8px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 700;
        }
        .comp-legende {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          padding: 10px 14px;
          background: rgba(111,66,193,0.08);
          border-radius: 8px;
          border: 1px solid #2a1a5e;
        }
        .comp-legende-text {
          font-size: 0.78rem;
          color: #888;
          width: 100%;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}