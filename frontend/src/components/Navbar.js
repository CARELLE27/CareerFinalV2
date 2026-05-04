import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ onLogout, isAdmin, toggleBtn }) {
  const loc = useLocation();
  const active = (path) => loc.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="nav-brand">
        🎮 <strong>CareerQuest</strong>
      </Link>

      <div className="nav-links">
        <Link to="/dashboard"  className={`nav-link ${active('/dashboard')  ? 'active' : ''}`}>🏠 Accueil</Link>
        <Link to="/quetes"     className={`nav-link ${active('/quetes')     ? 'active' : ''}`}>⚔️ Quêtes</Link>
        <Link to="/profil"     className={`nav-link ${active('/profil')     ? 'active' : ''}`}>👤 Profil</Link>
        <Link to="/classement" className={`nav-link ${active('/classement') ? 'active' : ''}`}>🏆 Classement</Link>
        {/* ✅ Masqué si pas admin */}
        {isAdmin && (
          <Link to="/admin" className={`nav-link nav-link-admin ${active('/admin') ? 'active' : ''}`}>🛡️ Admin</Link>
        )}
      </div>

      <div className="nav-actions">
        {toggleBtn}
        <button className="btn-deconnexion" onClick={onLogout}>Déconnexion</button>
      </div>
    </nav>
  );
}