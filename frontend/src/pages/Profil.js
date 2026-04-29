import React, { useState, useEffect } from 'react';
import { getProfil, getMesCompetences, getCompetences, ajouterCompetence, connectGithub } from '../services/api';

export default function Profil() {
  const [user, setUser]                 = useState(null);
  const [competences, setCompetences]   = useState([]);
  const [mesComps, setMesComps]         = useState([]);
  const [githubUser, setGithubUser]     = useState('');
  const [githubRepos, setGithubRepos]   = useState([]);
  const [message, setMessage]           = useState('');

  useEffect(() => {
    getProfil().then(r => { setUser(r.data); setGithubUser(r.data.github_username || ''); }).catch(() => {});
    getCompetences().then(r => setCompetences(r.data)).catch(() => {});
    getMesCompetences().then(r => setMesComps(r.data)).catch(() => {});
  }, []);

  const handleAjouterComp = async (id) => {
    try {
      await ajouterCompetence(id);
      getMesCompetences().then(r => setMesComps(r.data));
      getProfil().then(r => setUser(r.data));
      setMessage('+20 XP ! Compétence ajoutée 🎉');
      setTimeout(() => setMessage(''), 2500);
    } catch {}
  };

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

      {/* Arbre de compétences par catégorie */}
      <section className="section">
        <h2>🧠 Arbre de Compétences</h2>
        {categories.map(cat => (
          <div key={cat} className="comp-category">
            <h3 className="comp-cat-title">{cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
            <div className="competences-grid">
              {competences.filter(c => c.categorie === cat).map(c => {
                const owned   = mesCompIds.includes(c.id);
                const locked  = user.level < c.niveau_requis;
                return (
                  <div
                    key={c.id}
                    className={`comp-badge ${owned ? 'owned' : locked ? 'locked' : 'available'}`}
                    onClick={() => !owned && !locked && handleAjouterComp(c.id)}
                    title={locked ? `Niveau ${c.niveau_requis} requis` : ''}
                  >
                    {owned ? '✅ ' : locked ? '🔒 ' : '➕ '}{c.nom}
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
          <input type="text" placeholder="Votre pseudo GitHub" value={githubUser} onChange={e => setGithubUser(e.target.value)} />
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
    </div>
  );
}
