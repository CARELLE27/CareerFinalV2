import React, { useState, useEffect } from 'react';
import {
  getAdminStats, getAdminUsers, getAdminQuetes, getAdminCompetences,
  getAdminSoumissions, validerSoumission, creerQuete, supprimerQuete,
  creerCompetence, supprimerCompetence, supprimerUser
} from '../services/api';
import './AdminPanel.css';

const TABS = [
  { id: 'stats',       label: '📊 Statistiques' },
  { id: 'soumissions', label: '⏳ Soumissions' },
  { id: 'users',       label: '👥 Utilisateurs' },
  { id: 'quetes',      label: '⚔️ Quêtes' },
  { id: 'competences', label: '🧠 Compétences' },
];

export default function AdminPanel() {
  const [tab, setTab]               = useState('stats');
  const [stats, setStats]           = useState(null);
  const [users, setUsers]           = useState([]);
  const [quetes, setQuetes]         = useState([]);
  const [competences, setComps]     = useState([]);
  const [soumissions, setSoumissions] = useState([]);
  const [toast, setToast]           = useState('');
  const [showFormQuete, setShowFormQuete]   = useState(false);
  const [showFormComp, setShowFormComp]     = useState(false);
  const [loadingId, setLoadingId]   = useState(null);

  // Formulaire nouvelle quête
  const [newQuete, setNewQuete] = useState({
    titre: '', description: '', instructions: '', points: 50,
    type_quete: 'quiz', icone: '⚔️', difficulte: 1,
    validation_config: '{}', competences_debloquees_ids: []
  });

  // Formulaire nouvelle compétence
  const [newComp, setNewComp] = useState({
    nom: '', categorie: 'backend', niveau_requis: 1, description: ''
  });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => { loadTab(tab); }, [tab]);

  const loadTab = async (t) => {
    try {
      if (t === 'stats')       { const r = await getAdminStats();       setStats(r.data); }
      if (t === 'users')       { const r = await getAdminUsers();       setUsers(r.data); }
      if (t === 'quetes')      { const r = await getAdminQuetes();      setQuetes(r.data); }
      if (t === 'competences') { const r = await getAdminCompetences(); setComps(r.data); }
      if (t === 'soumissions') { const r = await getAdminSoumissions(); setSoumissions(r.data); }
    } catch (err) {
      showToast('❌ Erreur de chargement');
    }
  };

  const handleValider = async (id, decision) => {
    const feedback = decision === 'refuse'
      ? prompt('Raison du refus (optionnel) :') || ''
      : '';
    setLoadingId(id);
    try {
      const res = await validerSoumission(id, decision, feedback);
      showToast(res.data.message + (res.data.competences_debloquees?.length
        ? ` 🎯 Compétences débloquées : ${res.data.competences_debloquees.join(', ')}`
        : ''));
      loadTab('soumissions');
    } catch { showToast('❌ Erreur'); }
    setLoadingId(null);
  };

  const handleCreerQuete = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newQuete,
        validation_config: JSON.parse(newQuete.validation_config || '{}'),
      };
      await creerQuete(payload);
      showToast('✅ Quête créée !');
      setShowFormQuete(false);
      setNewQuete({ titre: '', description: '', instructions: '', points: 50, type_quete: 'quiz', icone: '⚔️', difficulte: 1, validation_config: '{}', competences_debloquees_ids: [] });
      loadTab('quetes');
    } catch (err) {
      showToast('❌ Erreur : ' + JSON.stringify(err.response?.data));
    }
  };

  const handleSupprimerQuete = async (id, titre) => {
    if (!window.confirm(`Supprimer la quête "${titre}" ?`)) return;
    try {
      await supprimerQuete(id);
      showToast('🗑️ Quête supprimée');
      loadTab('quetes');
    } catch { showToast('❌ Erreur'); }
  };

  const handleCreerComp = async (e) => {
    e.preventDefault();
    try {
      await creerCompetence(newComp);
      showToast('✅ Compétence créée !');
      setShowFormComp(false);
      setNewComp({ nom: '', categorie: 'backend', niveau_requis: 1, description: '' });
      loadTab('competences');
    } catch { showToast('❌ Erreur'); }
  };

  const handleSupprimerComp = async (id, nom) => {
    if (!window.confirm(`Supprimer la compétence "${nom}" ?`)) return;
    try {
      await supprimerCompetence(id);
      showToast('🗑️ Compétence supprimée');
      loadTab('competences');
    } catch { showToast('❌ Erreur'); }
  };

  const handleSupprimerUser = async (id, username) => {
    if (!window.confirm(`Supprimer l'utilisateur "${username}" ? Cette action est irréversible.`)) return;
    try {
      await supprimerUser(id);
      showToast(`🗑️ Utilisateur ${username} supprimé`);
      loadTab('users');
    } catch { showToast('❌ Erreur — superuser requis'); }
  };

  return (
    <div className="admin-page">
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-header">
        <h1>🛡️ Panel Admin</h1>
        <p>Gestion de CareerQuest</p>
      </div>

      {/* TABS */}
      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === 'soumissions' && soumissions.length > 0 && (
              <span className="admin-badge">{soumissions.length}</span>
            )}
          </button>
        ))}
      </div>

      <div className="admin-content">

        {/* ── STATISTIQUES ── */}
        {tab === 'stats' && stats && (
          <div>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon">👥</div>
                <div className="admin-stat-val">{stats.total_users}</div>
                <div className="admin-stat-label">Utilisateurs</div>
              </div>
              <div className="admin-stat-card">
                <div className="admin-stat-icon">⚔️</div>
                <div className="admin-stat-val">{stats.total_quetes}</div>
                <div className="admin-stat-label">Quêtes actives</div>
              </div>
              <div className="admin-stat-card green">
                <div className="admin-stat-icon">✅</div>
                <div className="admin-stat-val">{stats.total_validees}</div>
                <div className="admin-stat-label">Validations</div>
              </div>
              <div className="admin-stat-card yellow">
                <div className="admin-stat-icon">⏳</div>
                <div className="admin-stat-val">{stats.total_en_attente}</div>
                <div className="admin-stat-label">En attente</div>
              </div>
              <div className="admin-stat-card red">
                <div className="admin-stat-icon">❌</div>
                <div className="admin-stat-val">{stats.total_refuses}</div>
                <div className="admin-stat-label">Refusées</div>
              </div>
              <div className="admin-stat-card purple">
                <div className="admin-stat-icon">🏆</div>
                <div className="admin-stat-val">{stats.total_xp_distribue}</div>
                <div className="admin-stat-label">XP distribués</div>
              </div>
            </div>

            <div className="admin-row">
              <div className="admin-card">
                <h3>🥇 Meilleur utilisateur</h3>
                <p className="admin-big-text">{stats.top_user}</p>
                <p className="admin-sub">{stats.top_user_points} XP</p>
              </div>
              <div className="admin-card">
                <h3>📊 Répartition des soumissions</h3>
                {Object.entries(stats.repartition).map(([k, v]) => (
                  <div key={k} className="admin-bar-row">
                    <span className="admin-bar-label">{k}</span>
                    <div className="admin-bar-bg">
                      <div className="admin-bar-fill" style={{
                        width: `${Math.min(100, (v / Math.max(...Object.values(stats.repartition), 1)) * 100)}%`,
                        background: k === 'valide' ? '#4ade80' : k === 'soumis' ? '#fde047' : k === 'refuse' ? '#f87171' : '#666'
                      }}/>
                    </div>
                    <span className="admin-bar-val">{v}</span>
                  </div>
                ))}
              </div>
              <div className="admin-card">
                <h3>🔥 Quêtes populaires</h3>
                {stats.quetes_populaires.map((q, i) => (
                  <div key={i} className="admin-popular-row">
                    <span>{q.quete__icone} {q.quete__titre}</span>
                    <span className="admin-popular-nb">{q.nb} fois</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SOUMISSIONS EN ATTENTE ── */}
        {tab === 'soumissions' && (
          <div>
            <h2 className="admin-section-title">⏳ Soumissions en attente de validation</h2>
            {soumissions.length === 0
              ? <div className="admin-empty">✅ Aucune soumission en attente</div>
              : soumissions.map(s => (
                <div key={s.id} className="admin-soumission-card">
                  <div className="admin-soum-header">
                    <span className="admin-soum-icon">{s.quete_icone}</span>
                    <div className="admin-soum-info">
                      <strong>{s.user}</strong>
                      <span className="admin-soum-quete">{s.quete}</span>
                      <span className="admin-soum-date">
                        {new Date(s.date_soumission).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    <span className="admin-soum-points">+{s.points} XP</span>
                  </div>
                  <div className="admin-soum-content">
                    <strong>Soumission :</strong>
                    <p className="admin-soum-text">{s.soumission}</p>
                  </div>
                  <div className="admin-soum-actions">
                    <button
                      className="admin-btn-valide"
                      disabled={loadingId === s.id}
                      onClick={() => handleValider(s.id, 'valide')}
                    >
                      ✅ Valider
                    </button>
                    <button
                      className="admin-btn-refuse"
                      disabled={loadingId === s.id}
                      onClick={() => handleValider(s.id, 'refuse')}
                    >
                      ❌ Refuser
                    </button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* ── UTILISATEURS ── */}
        {tab === 'users' && (
          <div>
            <h2 className="admin-section-title">👥 Utilisateurs ({users.length})</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Niveau</th>
                  <th>XP</th>
                  <th>Quêtes</th>
                  <th>Compétences</th>
                  <th>GitHub</th>
                  <th>Rôle</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong></td>
                    <td className="admin-muted">{u.email}</td>
                    <td><span className="admin-level-badge">Niv. {u.level}</span></td>
                    <td className="admin-xp">{u.points} XP</td>
                    <td>{u.quetes_validees}</td>
                    <td>{u.competences}</td>
                    <td className="admin-muted">{u.github || '—'}</td>
                    <td>
                      {u.is_staff ? <span className="admin-role staff">Admin</span>
                        : u.is_formateur ? <span className="admin-role formateur">Formateur</span>
                        : <span className="admin-role user">Étudiant</span>}
                    </td>
                    <td>
                      <button
                        className="admin-btn-delete"
                        onClick={() => handleSupprimerUser(u.id, u.username)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── QUÊTES ── */}
        {tab === 'quetes' && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">⚔️ Quêtes ({quetes.length})</h2>
              <button className="admin-btn-create" onClick={() => setShowFormQuete(!showFormQuete)}>
                {showFormQuete ? '✕ Annuler' : '+ Nouvelle quête'}
              </button>
            </div>

            {showFormQuete && (
              <form className="admin-form" onSubmit={handleCreerQuete}>
                <h3>Créer une nouvelle quête</h3>
                <div className="admin-form-grid">
                  <div className="admin-form-group">
                    <label>Titre *</label>
                    <input value={newQuete.titre} onChange={e => setNewQuete({...newQuete, titre: e.target.value})} required placeholder="Ex: Créer un repo GitHub"/>
                  </div>
                  <div className="admin-form-group">
                    <label>Icône</label>
                    <input value={newQuete.icone} onChange={e => setNewQuete({...newQuete, icone: e.target.value})} placeholder="🐙"/>
                  </div>
                  <div className="admin-form-group">
                    <label>Type de validation *</label>
                    <select value={newQuete.type_quete} onChange={e => setNewQuete({...newQuete, type_quete: e.target.value})}>
                      <option value="quiz">Quiz technique</option>
                      <option value="github_repo">Repo GitHub</option>
                      <option value="github_commit">Commits GitHub</option>
                      <option value="github_file">Fichiers dans repo</option>
                      <option value="url_submit">URL à soumettre</option>
                      <option value="admin_review">Validation formateur</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Points *</label>
                    <input type="number" value={newQuete.points} onChange={e => setNewQuete({...newQuete, points: parseInt(e.target.value)})} min="10" max="500"/>
                  </div>
                  <div className="admin-form-group">
                    <label>Difficulté</label>
                    <select value={newQuete.difficulte} onChange={e => setNewQuete({...newQuete, difficulte: parseInt(e.target.value)})}>
                      <option value={1}>⭐ Facile</option>
                      <option value={2}>⭐⭐ Moyen</option>
                      <option value={3}>⭐⭐⭐ Difficile</option>
                    </select>
                  </div>
                  <div className="admin-form-group full">
                    <label>Description *</label>
                    <textarea value={newQuete.description} onChange={e => setNewQuete({...newQuete, description: e.target.value})} rows={2} required/>
                  </div>
                  <div className="admin-form-group full">
                    <label>Instructions détaillées *</label>
                    <textarea value={newQuete.instructions} onChange={e => setNewQuete({...newQuete, instructions: e.target.value})} rows={4} required placeholder="Étapes numérotées pour l'utilisateur"/>
                  </div>
                  <div className="admin-form-group full">
                    <label>Config validation (JSON) — ex quiz: {`{"answer":"b","explanation":"..."}`}</label>
                    <textarea value={newQuete.validation_config} onChange={e => setNewQuete({...newQuete, validation_config: e.target.value})} rows={2} placeholder='{"answer": "b"}' className="admin-code"/>
                  </div>
                  <div className="admin-form-group full">
                    <label>Compétences débloquées automatiquement</label>
                    <div className="admin-comp-checkboxes">
                      {competences.map(c => (
                        <label key={c.id} className="admin-checkbox-label">
                          <input
                            type="checkbox"
                            checked={newQuete.competences_debloquees_ids.includes(c.id)}
                            onChange={e => {
                              const ids = e.target.checked
                                ? [...newQuete.competences_debloquees_ids, c.id]
                                : newQuete.competences_debloquees_ids.filter(i => i !== c.id);
                              setNewQuete({...newQuete, competences_debloquees_ids: ids});
                            }}
                          />
                          {c.nom} <span className="admin-cat-tag">{c.categorie}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <button type="submit" className="admin-btn-submit">✅ Créer la quête</button>
              </form>
            )}

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Quête</th>
                  <th>Type</th>
                  <th>Points</th>
                  <th>Difficulté</th>
                  <th>Compétences débloquées</th>
                  <th>Validations</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {quetes.map(q => (
                  <tr key={q.id}>
                    <td><span className="q-icon">{q.icone}</span> <strong>{q.titre}</strong></td>
                    <td><span className="admin-type-tag">{q.type_quete}</span></td>
                    <td className="admin-xp">+{q.points} XP</td>
                    <td>{'⭐'.repeat(q.difficulte)}</td>
                    <td>
                      {q.competences_debloquees?.length > 0
                        ? q.competences_debloquees.map(c => (
                          <span key={c.id} className="admin-comp-tag">{c.nom}</span>
                        ))
                        : <span className="admin-muted">—</span>
                      }
                    </td>
                    <td>{q.nb_validations} / {q.nb_soumissions}</td>
                    <td>
                      <button className="admin-btn-delete" onClick={() => handleSupprimerQuete(q.id, q.titre)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── COMPÉTENCES ── */}
        {tab === 'competences' && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">🧠 Compétences ({competences.length})</h2>
              <button className="admin-btn-create" onClick={() => setShowFormComp(!showFormComp)}>
                {showFormComp ? '✕ Annuler' : '+ Nouvelle compétence'}
              </button>
            </div>

            {showFormComp && (
              <form className="admin-form" onSubmit={handleCreerComp}>
                <h3>Créer une nouvelle compétence</h3>
                <div className="admin-form-grid">
                  <div className="admin-form-group">
                    <label>Nom *</label>
                    <input value={newComp.nom} onChange={e => setNewComp({...newComp, nom: e.target.value})} required placeholder="Ex: TypeScript"/>
                  </div>
                  <div className="admin-form-group">
                    <label>Catégorie *</label>
                    <select value={newComp.categorie} onChange={e => setNewComp({...newComp, categorie: e.target.value})}>
                      <option value="frontend">Frontend</option>
                      <option value="backend">Backend</option>
                      <option value="devops">DevOps</option>
                      <option value="data">Data</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Niveau requis</label>
                    <input type="number" value={newComp.niveau_requis} onChange={e => setNewComp({...newComp, niveau_requis: parseInt(e.target.value)})} min="1" max="30"/>
                  </div>
                  <div className="admin-form-group full">
                    <label>Description</label>
                    <input value={newComp.description} onChange={e => setNewComp({...newComp, description: e.target.value})} placeholder="Courte description de la compétence"/>
                  </div>
                </div>
                <button type="submit" className="admin-btn-submit">✅ Créer la compétence</button>
              </form>
            )}

            <table className="admin-table">
              <thead>
                <tr>
                  <th>Compétence</th>
                  <th>Catégorie</th>
                  <th>Niveau requis</th>
                  <th>Quêtes associées</th>
                  <th>Utilisateurs</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {competences.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.nom}</strong><div className="admin-muted small">{c.description}</div></td>
                    <td><span className={`admin-cat-tag ${c.categorie}`}>{c.categorie}</span></td>
                    <td>Niv. {c.niveau_requis}</td>
                    <td>
                      {c.quetes_associees?.length > 0
                        ? c.quetes_associees.map(q => <div key={q.id} className="admin-muted small">{q.titre}</div>)
                        : <span className="admin-muted">Aucune</span>
                      }
                    </td>
                    <td>{c.nb_users} users</td>
                    <td>
                      <button className="admin-btn-delete" onClick={() => handleSupprimerComp(c.id, c.nom)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
