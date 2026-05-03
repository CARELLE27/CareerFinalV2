import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export default function Login({ onLogin }) {
  const [form, setForm]   = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate          = useNavigate();

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setError('');
  //   try {
  //     const res = await login(form);
  //     onLogin(res.data.access);
  //     navigate('/dashboard');
  //   } catch {
  //     setError('Identifiants incorrects');
  //   }
  // };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  try {
    const res = await login({ username, password });
    onLogin(res.data.access);
  } catch {
    setError('❌ Nom d\'utilisateur ou mot de passe incorrect.');
  }
};



  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🎮 CareerQuest</h1>
        <h2>Connexion</h2>
        {/* {error && <p className="error">{error}</p>} */}
       
{error && <p className="error" style={{color:'#f87171', textAlign:'center'}}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input type="text"     placeholder="Nom d'utilisateur" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
          <input type="password" placeholder="Mot de passe"      value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button type="submit" className="btn-primary">Se connecter</button>
        </form>
        <p>Pas de compte ? <Link to="/register">S'inscrire</Link></p>
      </div>
    </div>
  );
}
