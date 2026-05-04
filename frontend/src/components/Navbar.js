import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ onLogout, isAdmin, isDark, onToggleTheme }) {
  const loc = useLocation();

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`nav-link ${loc.pathname === to ? 'active' : ''}`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="nav-brand">
        🎮 <strong>CareerQuest</strong>
      </Link>

      <div className="nav-links">
        {navLink('/dashboard',  '🏠 Accueil')}
        {navLink('/quetes',     '⚔️ Quêtes')}
        {navLink('/profil',     '👤 Profil')}
        {navLink('/classement', '🏆 Classement')}
        {isAdmin && navLink('/admin', '🛡️ Admin')}
      </div>

      <div className="nav-actions">
        {/* ✅ Bouton toggle thème — simple et visible */}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <button className="btn-deconnexion" onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </nav>
  );
}