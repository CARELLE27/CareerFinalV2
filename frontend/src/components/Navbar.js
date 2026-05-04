import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ onLogout, isAdmin, toggleBtn }) {
  const loc = useLocation();

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="nav-brand">
        🎮 <strong>CareerQuest</strong>
      </Link>

      <div className="nav-links">
        <Link to="/dashboard"  className={`nav-link ${loc.pathname==='/dashboard'  ?'active':''}`}>🏠 Accueil</Link>
        <Link to="/quetes"     className={`nav-link ${loc.pathname==='/quetes'     ?'active':''}`}>⚔️ Quêtes</Link>
        <Link to="/profil"     className={`nav-link ${loc.pathname==='/profil'     ?'active':''}`}>👤 Profil</Link>
        <Link to="/classement" className={`nav-link ${loc.pathname==='/classement' ?'active':''}`}>🏆 Classement</Link>
        {isAdmin && <Link to="/admin" className={`nav-link ${loc.pathname==='/admin'?'active':''}`}>🛡️ Admin</Link>}
      </div>

      <div className="nav-actions">
        {/* ✅ Bouton toggle reçu depuis App.js */}
        {toggleBtn}
        <button className="btn-deconnexion" onClick={onLogout}>Déconnexion</button>
      </div>
    </nav>
  );
}