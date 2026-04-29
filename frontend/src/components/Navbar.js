import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const LINKS = [
  { to: '/dashboard',  label: '🏠 Accueil' },
  { to: '/quetes',     label: '⚔️ Quêtes' },
  { to: '/profil',     label: '👤 Profil' },
  { to: '/classement', label: '🏆 Classement' },
];

export default function Navbar({ onLogout }) {
  const location = useLocation();
  return (
    <nav className="navbar">
      <span className="navbar-brand">🎮 CareerQuest</span>
      <div className="navbar-links">
        {LINKS.map(l => (
          <Link key={l.to} to={l.to} className={location.pathname === l.to ? 'active' : ''}>
            {l.label}
          </Link>
        ))}
        <button onClick={onLogout} className="btn-logout">Déconnexion</button>
      </div>
    </nav>
  );
}
