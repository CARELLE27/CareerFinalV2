import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');   // ✅ déclaré
  const [password, setPassword] = useState('');   // ✅ déclaré
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ username, password });
      onLogin(res.data.access);
      navigate('/dashboard');
    } catch {
      setError('❌ Nom d\'utilisateur ou mot de passe incorrect.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🎮 CareerQuest</h1>
        <h2>Connexion</h2>

        {error && (
          <p style={{
            color: '#f87171',
            background: 'rgba(220,38,38,0.1)',
            border: '1px solid #dc2626',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.85rem',
            textAlign: 'center',
            marginBottom: '12px'
          }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p>Pas de compte ? <Link to="/register">S'inscrire</Link></p>
      </div>
    </div>
  );
}