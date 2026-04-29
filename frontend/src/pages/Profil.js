import React, { useState, useEffect } from 'react';
import { getProfil, getMesCompetences, getCompetences, connectGithub } from '../services/api';

export default function Profil() {
  const [user, setUser]               = useState(null);
  const [competences, setCompetences] = useState([]);
  const [mesComps, setMesComps]       = useState([]);
  const [githubUser, setGithubUser]   = useState('');
  const [githubRepos, setGithubRepos] = useState([]);
  const [message, setMessage]         = useState('');

  useEffect(() => {
    getProfil().then(r => {
      setUser(r.data);
      setGithubUser(r.data.github_username || '');
    }).catch(() => {});
    getCompetences().then(r => setCompetences(r.data)).catch(() => {});
    getMesCompetences().then(r => setMesComps(r.data)).catch(() => {});
  }, []);

  const handleGithub = async (e) => {
    e.preventDefault();
    try {
      const res = await connectGithub(githubUser);
      setGithubRepos(res.data.repos);
      setMessage(res.data.message);
      getProfil().then(r => setUser(r.data));
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Impossible de charger GitHub');
    }
  };

  if (!user) return <div className="loading">Chargement...</div>;

  const mesCompIds = mesComps.map(mc => mc.competence.id);
  const categories = [...new Set(competences.map(c => c.categorie))];

  return (
    <div className="page">
      <h1>👤 Mon Profil</h1>
      {message && <div className="toast">{message}</div>}

      <div className="profil-header">
        <h2>{user.username}</h2>
        <p>Niveau {user.level} • {user.points} XP</p>
        {user.github_username && <p>🐙 GitHub : {user.github_username}</p>}
      </div>

      {/* Arbre de compétences */}
      <section className="section">
        <h2>🧠 Arbre de Compétences</h2>

        {/* Légende */}
        <div className="comp-legende">
          <span className="comp-badge owned" style={{cursor:'default'}}>✅ Débloquée</span>
          <span className="comp-badge locked" style={{cursor:'default'}}>🔒 Via quête</span>
          <p className="comp-legende-text">
            Les compétences se débloquent automatiquement en validant les quêtes associées.
          </p>
        </div>

        {categories.map(cat => (
          <div key={cat} className="comp-category">
            <h3 className="comp-cat-title">
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </h3>
            <div className="competences-grid">
              {competences.filter(c => c.categorie === cat).map(c => {
                const owned = mesCompIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`comp-badge ${owned ? 'owned' : 'locked'}`}
                    title={owned
                      ? 'Compétence débloquée via une quête ✅'
                      : 'Complétez une quête associée pour débloquer cette compétence'
                    }
                  >
                    {owned ? '✅ ' : '🔒 '}{c.nom}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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