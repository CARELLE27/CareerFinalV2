import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeSwitcher from './ThemeSwitcher';


export default function Navbar({ onLogout, isAdmin }) {
  const location = useLocation();

  const links = [
    { to: '/dashboard',  label: '🏠 Accueil' },
    { to: '/quetes',     label: '⚔️ Quêtes' },
    { to: '/profil',     label: '👤 Profil' },
    { to: '/classement', label: '🏆 Classement' },
  ];

  return (
    <nav className="navbar">
      <span className="navbar-brand">🎮 CareerQuest</span>
      <div className="navbar-links">
        {links.map(l => (
          <Link key={l.to} to={l.to} className={location.pathname === l.to ? 'active' : ''}>
            {l.label}
          </Link>
        ))}
        {/* Lien Admin visible uniquement pour formateurs/admins */}
        {isAdmin && (
          <Link to="/admin" className={location.pathname === '/admin' ? 'active admin-link' : 'admin-link'}>
            🛡️ Admin
          </Link>
        )}
        <button onClick={onLogout} className="btn-logout">Déconnexion</button>
      </div>
    </nav>
  );
}
