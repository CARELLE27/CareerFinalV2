import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';

export default function Register() {
  const [form, setForm]       = useState({ username: '', email: '', password: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      setSuccess('Compte créé ! Redirection...');
      setTimeout(() => navigate('/login'), 1500);
    } catch {
      setError('Erreur lors de la création du compte');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🎮 CareerQuest</h1>
        <h2>Créer un compte</h2>
        {error   && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}
        <form onSubmit={handleSubmit}>
          <input type="text"     placeholder="Nom d'utilisateur" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
          <input type="email"    placeholder="Email"             value={form.email}    onChange={e => setForm({...form, email: e.target.value})}    required />
          <input type="password" placeholder="Mot de passe"      value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button type="submit" className="btn-primary">S'inscrire</button>
        </form>
        <p>Déjà un compte ? <Link to="/login">Se connecter</Link></p>
      </div>
    </div>
  );
}
