import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, getFilieres } from '../services/api';

export default function Register() {
  const [form, setForm] = useState({
    username: '', email: '', password: '',
    ecole: '', filieres: []          // ✅ tableau de filières
  });
  const [filieres, setFilieres] = useState([]);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const navigate                = useNavigate();

  useEffect(() => {
    getFilieres().then(r => setFilieres(r.data)).catch(() => {});
  }, []);

  const toggleFiliere = (value) => {
    setForm(f => ({
      ...f,
      filieres: f.filieres.includes(value)
        ? f.filieres.filter(v => v !== value)
        : [...f.filieres, value]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.filieres.length === 0) {
      setError('Veuillez sélectionner au moins une filière.');
      return;
    }
    try {
      await register(form);
      setSuccess('Compte créé ! Redirection...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const data = err.response?.data;
      if (data?.username) setError('Ce nom d\'utilisateur est déjà pris.');
      else if (data?.email) setError('Cet email est déjà utilisé.');
      else setError('Erreur lors de la création du compte.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <h1>🎮 CareerQuest</h1>
        <h2>Créer un compte</h2>

        {error   && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label>Nom d'utilisateur *</label>
            <input type="text" placeholder="ex: carelle27"
              value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))} required />
          </div>

          <div className="field-group">
            <label>Email *</label>
            <input type="email" placeholder="votre@email.com"
              value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
          </div>

          <div className="field-group">
            <label>Mot de passe *</label>
            <input type="password" placeholder="••••••••" minLength={6}
              value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
          </div>

          <div className="field-group">
            <label>École / Établissement</label>
            <input type="text" placeholder="ex: École IT Paris"
              value={form.ecole} onChange={e => setForm(f => ({...f, ecole: e.target.value}))} />
          </div>

          {/* ✅ Sélection multiple de filières */}
          <div className="field-group">
            <label>Vos filières * <span className="field-hint-inline">(plusieurs possibles)</span></label>
            <p className="field-hint">Les quêtes seront adaptées à vos domaines 🎯</p>
            <div className="filieres-grid">
              {filieres.map(f => (
                <button
                  key={f.value}
                  type="button"
                  className={`filiere-btn ${form.filieres.includes(f.value) ? 'active' : ''}`}
                  onClick={() => toggleFiliere(f.value)}
                >
                  {form.filieres.includes(f.value) && <span className="check">✓ </span>}
                  {f.label}
                </button>
              ))}
            </div>
            {form.filieres.length > 0 && (
              <p className="filieres-selected">
                ✅ {form.filieres.length} filière{form.filieres.length > 1 ? 's' : ''} sélectionnée{form.filieres.length > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
            Créer mon compte ⚔️
          </button>
        </form>

        <p>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
      </div>

      <style>{`
        .register-card { max-width: 540px; }
        .field-group { margin-bottom: 14px; }
        .field-group label { display: block; font-size: 0.82rem; color: #a78bfa; font-weight: 600; margin-bottom: 5px; letter-spacing: 0.5px; }
        .field-hint { font-size: 0.75rem; color: #888; margin-bottom: 8px; font-style: italic; }
        .field-hint-inline { font-size: 0.72rem; color: #888; font-weight: 400; font-style: italic; }
        .field-group input { margin-bottom: 0; }
        .filieres-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .filiere-btn {
          background: #0f0f1a; border: 1px solid #333; color: #aaa;
          padding: 10px 12px; border-radius: 8px; cursor: pointer;
          font-size: 0.82rem; text-align: left; transition: all 0.2s; font-family: inherit;
        }
        .filiere-btn:hover { border-color: #6f42c1; color: #a78bfa; }
        .filiere-btn.active { background: rgba(111,66,193,0.2); border-color: #7c3aed; color: #a78bfa; font-weight: 700; }
        .check { color: #4ade80; }
        .filieres-selected { font-size: 0.78rem; color: #4ade80; margin-top: 8px; }
      `}</style>
    </div>
  );
}