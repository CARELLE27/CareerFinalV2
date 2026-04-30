import React, { useState, useEffect } from 'react';
import {
  getAdminStats, getAdminUsers, getAdminQuetes, getAdminCompetences,
  getAdminSoumissions, validerSoumission, creerQuete, supprimerQuete,
  creerCompetence, supprimerCompetence, supprimerUser,
  getAdminEcoles, creerEcole, supprimerEcole,
  getAdminFilieres, creerFiliere, supprimerFiliere
} from '../services/api';
import './AdminPanel.css';

const TABS = [
  { id: 'stats',       label: '📊 Statistiques' },
  { id: 'soumissions', label: '⏳ Soumissions' },
  { id: 'users',       label: '👥 Utilisateurs' },
  { id: 'quetes',      label: '⚔️ Quêtes' },
  { id: 'competences', label: '🧠 Compétences' },
  { id: 'ecoles',      label: '🏫 Écoles' },
  { id: 'filieres',    label: '📚 Filières' },
];

export default function AdminPanel() {
  const [tab, setTab]                     = useState('stats');
  const [stats, setStats]                 = useState(null);
  const [users, setUsers]                 = useState([]);
  const [quetes, setQuetes]               = useState([]);
  const [competences, setComps]           = useState([]);
  const [soumissions, setSoumissions]     = useState([]);
  const [ecoles, setEcoles]               = useState([]);
  const [filieres, setFilieres]           = useState([]);
  const [toast, setToast]                 = useState('');
  const [loadingId, setLoadingId]         = useState(null);

  // Formulaires
  const [showFormQuete,   setShowFormQuete]   = useState(false);
  const [showFormComp,    setShowFormComp]    = useState(false);
  const [showFormEcole,   setShowFormEcole]   = useState(false);
  const [showFormFiliere, setShowFormFiliere] = useState(false);

  const [newQuete, setNewQuete] = useState({
    titre: '', description: '', instructions: '', points: 50,
    type_quete: 'quiz', icone: '⚔️', difficulte: 1,
    validation_config: '{}', competences_debloquees_ids: [],
    filieres_cibles: []
  });
  const [newComp, setNewComp] = useState({
    nom: '', categorie: 'backend', niveau_requis: 1, description: '',
    filieres_cibles: []
  });
  const [newEcole, setNewEcole]       = useState({ nom: '', ville: '', pays: 'France' });
  const [newFiliere, setNewFiliere]   = useState({ code: '', label: '', icone: '🎓', ordre: 99 });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  useEffect(() => { loadTab(tab); }, [tab]);

  const loadTab = async (t) => {
    try {
      if (t === 'stats')       { const r = await getAdminStats();       setStats(r.data); }
      if (t === 'users')       { const r = await getAdminUsers();       setUsers(r.data); }
      if (t === 'quetes')      { const r = await getAdminQuetes();      setQuetes(r.data); }
      if (t === 'competences') { const r = await getAdminCompetences(); setComps(r.data); }
      if (t === 'soumissions') { const r = await getAdminSoumissions(); setSoumissions(r.data); }
      if (t === 'ecoles')      { const r = await getAdminEcoles();      setEcoles(r.data); }
      if (t === 'filieres')    { const r = await getAdminFilieres();    setFilieres(r.data); }
    } catch { showToast('❌ Erreur de chargement'); }
  };

  // ── SOUMISSIONS ──────────────────────────────────────────
  const handleValider = async (id, decision) => {
    const feedback = decision === 'refuse' ? prompt('Raison du refus (optionnel) :') || '' : '';
    setLoadingId(id);
    try {
      const res = await validerSoumission(id, decision, feedback);
      showToast(res.data.message + (res.data.competences_debloquees?.length
        ? ` 🎯 ${res.data.competences_debloquees.join(', ')}` : ''));
      loadTab('soumissions');
    } catch { showToast('❌ Erreur'); }
    setLoadingId(null);
  };

  // ── QUÊTES ───────────────────────────────────────────────
  const handleCreerQuete = async (e) => {
    e.preventDefault();
    try {
      await creerQuete({ ...newQuete, validation_config: JSON.parse(newQuete.validation_config || '{}') });
      showToast('✅ Quête créée !');
      setShowFormQuete(false);
      setNewQuete({ titre:'', description:'', instructions:'', points:50, type_quete:'quiz', icone:'⚔️', difficulte:1, validation_config:'{}', competences_debloquees_ids:[], filieres_cibles:[] });
      loadTab('quetes');
    } catch (err) { showToast('❌ ' + JSON.stringify(err.response?.data)); }
  };

  const handleSupprimerQuete = async (id, titre) => {
    if (!window.confirm(`Supprimer "${titre}" ?`)) return;
    try { await supprimerQuete(id); showToast('🗑️ Quête supprimée'); loadTab('quetes'); }
    catch { showToast('❌ Erreur'); }
  };

  // ── COMPÉTENCES ──────────────────────────────────────────
  const handleCreerComp = async (e) => {
    e.preventDefault();
    try {
      await creerCompetence(newComp);
      showToast('✅ Compétence créée !');
      setShowFormComp(false);
      setNewComp({ nom:'', categorie:'backend', niveau_requis:1, description:'', filieres_cibles:[] });
      loadTab('competences');
    } catch { showToast('❌ Erreur'); }
  };

  const handleSupprimerComp = async (id, nom) => {
    if (!window.confirm(`Supprimer "${nom}" ?`)) return;
    try { await supprimerCompetence(id); showToast('🗑️ Supprimée'); loadTab('competences'); }
    catch { showToast('❌ Erreur'); }
  };

  // ── UTILISATEURS ─────────────────────────────────────────
  const handleSupprimerUser = async (id, username) => {
    if (!window.confirm(`Supprimer "${username}" ? Action irréversible.`)) return;
    try { await supprimerUser(id); showToast(`🗑️ ${username} supprimé`); loadTab('users'); }
    catch { showToast('❌ Erreur — superuser requis'); }
  };

  // ── ÉCOLES ───────────────────────────────────────────────
  const handleCreerEcole = async (e) => {
    e.preventDefault();
    try {
      await creerEcole(newEcole);
      showToast('✅ École ajoutée !');
      setShowFormEcole(false);
      setNewEcole({ nom:'', ville:'', pays:'France' });
      loadTab('ecoles');
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || 'Erreur'));
    }
  };

  const handleSupprimerEcole = async (id, nom) => {
    if (!window.confirm(`Désactiver "${nom}" ?`)) return;
    try { await supprimerEcole(id); showToast('🗑️ École désactivée'); loadTab('ecoles'); }
    catch { showToast('❌ Erreur'); }
  };

  // ── FILIÈRES ─────────────────────────────────────────────
  const handleCreerFiliere = async (e) => {
    e.preventDefault();
    try {
      await creerFiliere(newFiliere);
      showToast('✅ Filière créée !');
      setShowFormFiliere(false);
      setNewFiliere({ code:'', label:'', icone:'🎓', ordre:99 });
      loadTab('filieres');
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || 'Erreur'));
    }
  };

  const handleSupprimerFiliere = async (id, label) => {
    if (!window.confirm(`Désactiver "${label}" ?`)) return;
    try { await supprimerFiliere(id); showToast('🗑️ Filière désactivée'); loadTab('filieres'); }
    catch { showToast('❌ Erreur'); }
  };

  // ── Toggle filière dans un formulaire ────────────────────
  const toggleFiliereForm = (setter, current, value) => {
    setter(f => ({
      ...f,
      filieres_cibles: current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
    }));
  };

  const allFilieresCodes = filieres.map(f => f.code);

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

        {/* ═══ STATISTIQUES ═══ */}
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
                <h3>📊 Répartition soumissions</h3>
                {Object.entries(stats.repartition || {}).map(([k, v]) => (
                  <div key={k} className="admin-bar-row">
                    <span className="admin-bar-label">{k}</span>
                    <div className="admin-bar-bg">
                      <div className="admin-bar-fill" style={{
                        width: `${Math.min(100,(v/Math.max(...Object.values(stats.repartition),1))*100)}%`,
                        background: k==='valide'?'#4ade80':k==='soumis'?'#fde047':k==='refuse'?'#f87171':'#666'
                      }}/>
                    </div>
                    <span className="admin-bar-val">{v}</span>
                  </div>
                ))}
              </div>
              <div className="admin-card">
                <h3>🎓 Répartition par filière</h3>
                {(stats.stats_filieres || []).map((f, i) => (
                  <div key={i} className="admin-popular-row">
                    <span>{f.label}</span>
                    <span className="admin-popular-nb">{f.nb_users} users</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-card" style={{marginTop:'16px'}}>
              <h3>🔥 Quêtes les plus complétées</h3>
              {(stats.quetes_populaires || []).map((q, i) => (
                <div key={i} className="admin-popular-row">
                  <span>{q.quete__icone} {q.quete__titre}</span>
                  <span className="admin-popular-nb">{q.nb} fois</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SOUMISSIONS ═══ */}
        {tab === 'soumissions' && (
          <div>
            <h2 className="admin-section-title">⏳ Soumissions en attente</h2>
            {soumissions.length === 0
              ? <div className="admin-empty">✅ Aucune soumission en attente</div>
              : soumissions.map(s => (
                <div key={s.id} className="admin-soumission-card">
                  <div className="admin-soum-header">
                    <span className="admin-soum-icon">{s.quete_icone}</span>
                    <div className="admin-soum-info">
                      <strong>{s.user}</strong>
                      {s.user_ecole && <span className="admin-soum-quete">🏫 {s.user_ecole}</span>}
                      {s.user_filiere && <span className="admin-soum-quete">{s.user_filiere}</span>}
                      <span className="admin-soum-quete">{s.quete}</span>
                      <span className="admin-soum-date">{new Date(s.date_soumission).toLocaleString('fr-FR')}</span>
                    </div>
                    <span className="admin-soum-points">+{s.points} XP</span>
                  </div>
                  <div className="admin-soum-content">
                    <strong>Soumission :</strong>
                    <p className="admin-soum-text">{s.soumission}</p>
                  </div>
                  <div className="admin-soum-actions">
                    <button className="admin-btn-valide" disabled={loadingId===s.id} onClick={() => handleValider(s.id,'valide')}>✅ Valider</button>
                    <button className="admin-btn-refuse" disabled={loadingId===s.id} onClick={() => handleValider(s.id,'refuse')}>❌ Refuser</button>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* ═══ UTILISATEURS ═══ */}
        {tab === 'users' && (
          <div>
            <h2 className="admin-section-title">👥 Utilisateurs ({users.length})</h2>
            <table className="admin-table">
              <thead>
                <tr><th>Utilisateur</th><th>Email</th><th>École</th><th>Filières</th><th>Niv.</th><th>XP</th><th>Quêtes</th><th>Rôle</th><th>Action</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong></td>
                    <td className="admin-muted small">{u.email}</td>
                    <td className="admin-muted small">{u.ecole || '—'}</td>
                    <td>
                      <div style={{display:'flex',gap:'3px',flexWrap:'wrap'}}>
                        {(u.filieres||[]).map((f,i) => (
                          <span key={i} className="admin-comp-tag" style={{fontSize:'0.65rem'}}>{f}</span>
                        ))}
                        {(!u.filieres||u.filieres.length===0) && <span className="admin-muted">—</span>}
                      </div>
                    </td>
                    <td><span className="admin-level-badge">Niv. {u.level}</span></td>
                    <td className="admin-xp">{u.points}</td>
                    <td>{u.quetes_validees}</td>
                    <td>
                      {u.is_staff ? <span className="admin-role staff">Admin</span>
                        : u.is_formateur ? <span className="admin-role formateur">Formateur</span>
                        : <span className="admin-role user">Étudiant</span>}
                    </td>
                    <td><button className="admin-btn-delete" onClick={() => handleSupprimerUser(u.id, u.username)}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ QUÊTES ═══ */}
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
                <h3>Créer une quête</h3>
                <div className="admin-form-grid">
                  <div className="admin-form-group"><label>Titre *</label>
                    <input value={newQuete.titre} onChange={e => setNewQuete(q=>({...q,titre:e.target.value}))} required /></div>
                  <div className="admin-form-group"><label>Icône</label>
                    <input value={newQuete.icone} onChange={e => setNewQuete(q=>({...q,icone:e.target.value}))} /></div>
                  <div className="admin-form-group"><label>Type *</label>
                    <select value={newQuete.type_quete} onChange={e => setNewQuete(q=>({...q,type_quete:e.target.value}))}>
                      <option value="quiz">Quiz technique</option>
                      <option value="github_repo">Repo GitHub</option>
                      <option value="github_commit">Commits GitHub</option>
                      <option value="github_file">Fichiers dans repo</option>
                      <option value="url_submit">URL à soumettre</option>
                      <option value="admin_review">Validation formateur</option>
                    </select></div>
                  <div className="admin-form-group"><label>Points *</label>
                    <input type="number" value={newQuete.points} min="10" max="500"
                      onChange={e => setNewQuete(q=>({...q,points:parseInt(e.target.value)}))} /></div>
                  <div className="admin-form-group"><label>Difficulté</label>
                    <select value={newQuete.difficulte} onChange={e => setNewQuete(q=>({...q,difficulte:parseInt(e.target.value)}))}>
                      <option value={1}>⭐ Facile</option><option value={2}>⭐⭐ Moyen</option><option value={3}>⭐⭐⭐ Difficile</option>
                    </select></div>
                  <div className="admin-form-group full"><label>Description *</label>
                    <textarea value={newQuete.description} rows={2} required onChange={e => setNewQuete(q=>({...q,description:e.target.value}))} /></div>
                  <div className="admin-form-group full"><label>Instructions *</label>
                    <textarea value={newQuete.instructions} rows={4} required onChange={e => setNewQuete(q=>({...q,instructions:e.target.value}))} /></div>
                  <div className="admin-form-group full"><label>Config validation (JSON)</label>
                    <textarea value={newQuete.validation_config} rows={2} className="admin-code"
                      onChange={e => setNewQuete(q=>({...q,validation_config:e.target.value}))} /></div>
                  <div className="admin-form-group full">
                    <label>Filières ciblées <span style={{color:'#888',fontWeight:400}}>(vide = toutes)</span></label>
                    <div className="admin-comp-checkboxes">
                      {filieres.map(f => (
                        <label key={f.code} className="admin-checkbox-label">
                          <input type="checkbox"
                            checked={newQuete.filieres_cibles.includes(f.code)}
                            onChange={() => toggleFiliereForm(setNewQuete, newQuete.filieres_cibles, f.code)}
                          />
                          {f.icone} {f.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="admin-form-group full">
                    <label>Compétences débloquées</label>
                    <div className="admin-comp-checkboxes">
                      {competences.map(c => (
                        <label key={c.id} className="admin-checkbox-label">
                          <input type="checkbox"
                            checked={newQuete.competences_debloquees_ids.includes(c.id)}
                            onChange={e => {
                              const ids = e.target.checked
                                ? [...newQuete.competences_debloquees_ids, c.id]
                                : newQuete.competences_debloquees_ids.filter(i => i !== c.id);
                              setNewQuete(q=>({...q, competences_debloquees_ids: ids}));
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
                <tr><th>Quête</th><th>Type</th><th>Points</th><th>Diff.</th><th>Filières</th><th>Compétences</th><th>Validations</th><th>Action</th></tr>
              </thead>
              <tbody>
                {quetes.map(q => (
                  <tr key={q.id}>
                    <td><span className="q-icon">{q.icone}</span><strong>{q.titre}</strong></td>
                    <td><span className="admin-type-tag">{q.type_quete}</span></td>
                    <td className="admin-xp">+{q.points}</td>
                    <td>{'⭐'.repeat(q.difficulte)}</td>
                    <td>
                      {(q.filieres_cibles||[]).length > 0
                        ? (q.filieres_cibles||[]).map((f,i) => <span key={i} className="admin-comp-tag" style={{fontSize:'0.65rem'}}>{f}</span>)
                        : <span className="admin-muted" style={{fontSize:'0.72rem'}}>Toutes</span>}
                    </td>
                    <td>
                      {(q.competences_debloquees||[]).length > 0
                        ? (q.competences_debloquees||[]).map(c => <span key={c.id} className="admin-comp-tag">{c.nom}</span>)
                        : <span className="admin-muted">—</span>}
                    </td>
                    <td>{q.nb_validations}</td>
                    <td><button className="admin-btn-delete" onClick={() => handleSupprimerQuete(q.id,q.titre)}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ COMPÉTENCES ═══ */}
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
                <h3>Créer une compétence</h3>
                <div className="admin-form-grid">
                  <div className="admin-form-group"><label>Nom *</label>
                    <input value={newComp.nom} onChange={e => setNewComp(c=>({...c,nom:e.target.value}))} required /></div>
                  <div className="admin-form-group"><label>Catégorie *</label>
                    <select value={newComp.categorie} onChange={e => setNewComp(c=>({...c,categorie:e.target.value}))}>
                      {['frontend','backend','devops','data','redaction','langues','sciences','sante','maths','autre'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select></div>
                  <div className="admin-form-group"><label>Niveau requis</label>
                    <input type="number" min="1" max="30" value={newComp.niveau_requis}
                      onChange={e => setNewComp(c=>({...c,niveau_requis:parseInt(e.target.value)}))} /></div>
                  <div className="admin-form-group full"><label>Description</label>
                    <input value={newComp.description} onChange={e => setNewComp(c=>({...c,description:e.target.value}))} /></div>
                  <div className="admin-form-group full">
                    <label>Filières ciblées <span style={{color:'#888',fontWeight:400}}>(vide = toutes)</span></label>
                    <div className="admin-comp-checkboxes">
                      {filieres.map(f => (
                        <label key={f.code} className="admin-checkbox-label">
                          <input type="checkbox"
                            checked={newComp.filieres_cibles.includes(f.code)}
                            onChange={() => toggleFiliereForm(setNewComp, newComp.filieres_cibles, f.code)}
                          />
                          {f.icone} {f.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <button type="submit" className="admin-btn-submit">✅ Créer</button>
              </form>
            )}

            <table className="admin-table">
              <thead>
                <tr><th>Compétence</th><th>Catégorie</th><th>Niv.</th><th>Filières</th><th>Quêtes</th><th>Users</th><th>Action</th></tr>
              </thead>
              <tbody>
                {competences.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.nom}</strong><div className="admin-muted small">{c.description}</div></td>
                    <td><span className={`admin-cat-tag ${c.categorie}`}>{c.categorie}</span></td>
                    <td>Niv. {c.niveau_requis}</td>
                    <td>
                      {(c.filieres_cibles||[]).length > 0
                        ? (c.filieres_cibles||[]).map((f,i) => <span key={i} className="admin-comp-tag" style={{fontSize:'0.65rem'}}>{f}</span>)
                        : <span className="admin-muted small">Toutes</span>}
                    </td>
                    <td>{(c.quetes_associees||[]).length > 0
                        ? (c.quetes_associees||[]).map(q => <div key={q.id} className="admin-muted small">{q.titre}</div>)
                        : <span className="admin-muted">—</span>}</td>
                    <td>{c.nb_users}</td>
                    <td><button className="admin-btn-delete" onClick={() => handleSupprimerComp(c.id,c.nom)}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ ÉCOLES ═══ */}
        {tab === 'ecoles' && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">🏫 Écoles ({ecoles.length})</h2>
              <button className="admin-btn-create" onClick={() => setShowFormEcole(!showFormEcole)}>
                {showFormEcole ? '✕ Annuler' : '+ Ajouter une école'}
              </button>
            </div>

            {showFormEcole && (
              <form className="admin-form" onSubmit={handleCreerEcole}>
                <h3>Ajouter une nouvelle école</h3>
                <div className="admin-form-grid">
                  <div className="admin-form-group full">
                    <label>Nom de l'école *</label>
                    <input value={newEcole.nom} onChange={e => setNewEcole(s=>({...s,nom:e.target.value}))}
                      placeholder="ex: École IT Paris" required />
                  </div>
                  <div className="admin-form-group">
                    <label>Ville</label>
                    <input value={newEcole.ville} onChange={e => setNewEcole(s=>({...s,ville:e.target.value}))}
                      placeholder="ex: Paris" />
                  </div>
                  <div className="admin-form-group">
                    <label>Pays</label>
                    <input value={newEcole.pays} onChange={e => setNewEcole(s=>({...s,pays:e.target.value}))}
                      placeholder="ex: France" />
                  </div>
                </div>
                <button type="submit" className="admin-btn-submit">✅ Ajouter l'école</button>
              </form>
            )}

            {ecoles.length === 0
              ? <div className="admin-empty">Aucune école enregistrée. Ajoutez-en une !</div>
              : (
                <table className="admin-table">
                  <thead>
                    <tr><th>École</th><th>Ville</th><th>Pays</th><th>Étudiants</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {ecoles.map(e => (
                      <tr key={e.id}>
                        <td><strong>{e.nom}</strong></td>
                        <td className="admin-muted">{e.ville || '—'}</td>
                        <td className="admin-muted">{e.pays}</td>
                        <td>{e.nb_users} users</td>
                        <td><button className="admin-btn-delete" onClick={() => handleSupprimerEcole(e.id,e.nom)}>🗑️</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </div>
        )}

        {/* ═══ FILIÈRES ═══ */}
        {tab === 'filieres' && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">📚 Filières ({filieres.length})</h2>
              <button className="admin-btn-create" onClick={() => setShowFormFiliere(!showFormFiliere)}>
                {showFormFiliere ? '✕ Annuler' : '+ Créer une filière'}
              </button>
            </div>

            {showFormFiliere && (
              <form className="admin-form" onSubmit={handleCreerFiliere}>
                <h3>Créer une nouvelle filière</h3>
                <div className="admin-form-grid">
                  <div className="admin-form-group">
                    <label>Code unique * <span style={{color:'#888',fontWeight:400,fontSize:'0.72rem'}}>(ex: arts_graphiques)</span></label>
                    <input value={newFiliere.code} onChange={e => setNewFiliere(f=>({...f,code:e.target.value.toLowerCase().replace(/\s/g,'_')}))}
                      placeholder="arts_graphiques" required />
                  </div>
                  <div className="admin-form-group">
                    <label>Nom affiché *</label>
                    <input value={newFiliere.label} onChange={e => setNewFiliere(f=>({...f,label:e.target.value}))}
                      placeholder="Arts Graphiques" required />
                  </div>
                  <div className="admin-form-group">
                    <label>Icône emoji</label>
                    <input value={newFiliere.icone} onChange={e => setNewFiliere(f=>({...f,icone:e.target.value}))}
                      placeholder="🎨" style={{width:'80px'}} />
                  </div>
                  <div className="admin-form-group">
                    <label>Ordre d'affichage</label>
                    <input type="number" value={newFiliere.ordre}
                      onChange={e => setNewFiliere(f=>({...f,ordre:parseInt(e.target.value)}))} />
                  </div>
                </div>
                <button type="submit" className="admin-btn-submit">✅ Créer la filière</button>
              </form>
            )}

            <table className="admin-table">
              <thead>
                <tr><th>Icône</th><th>Code</th><th>Nom</th><th>Ordre</th><th>Statut</th><th>Étudiants</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filieres.map(f => (
                  <tr key={f.id}>
                    <td style={{fontSize:'1.3rem'}}>{f.icone}</td>
                    <td><code style={{fontSize:'0.72rem',color:'#a78bfa',background:'rgba(111,66,193,0.1)',padding:'2px 6px',borderRadius:'4px'}}>{f.code}</code></td>
                    <td><strong>{f.label}</strong></td>
                    <td className="admin-muted">{f.ordre}</td>
                    <td>
                      <span style={{
                        padding:'2px 8px', borderRadius:'10px', fontSize:'0.72rem', fontWeight:'700',
                        background: f.active ? 'rgba(22,163,74,0.2)' : 'rgba(100,100,100,0.2)',
                        color: f.active ? '#4ade80' : '#888'
                      }}>
                        {f.active ? '✅ Active' : '⏸️ Inactive'}
                      </span>
                    </td>
                    <td>{f.nb_users} users</td>
                    <td><button className="admin-btn-delete" onClick={() => handleSupprimerFiliere(f.id,f.label)}>🗑️</button></td>
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