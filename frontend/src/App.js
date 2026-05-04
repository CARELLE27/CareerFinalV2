import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Quetes from './pages/Quetes';
import Profil from './pages/Profil';
import Classement from './pages/Classement';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminPanel from './pages/AdminPanel';
import './App.css';

const THEMES = {
  dark: {
    '--bg-main': '#07071a', '--bg-card': '#1a1a2e', '--bg-input': '#07071a',
    '--border': '#2a1a5e', '--text-main': '#e0e0f0', '--text-sub': '#a78bfa',
    '--purple': '#7c3aed', '--navbar-bg': '#1a1a2e',
    '--hero-bg': 'linear-gradient(135deg,#1a1a2e,#2d1060)',
    '--stat-bg': 'rgba(111,66,193,0.2)',
  },
  light: {
    '--bg-main': '#f8f7ff', '--bg-card': '#ffffff', '--bg-input': '#ffffff',
    '--border': '#ddd6fe', '--text-main': '#1f2937', '--text-sub': '#5b21b6',
    '--purple': '#7c3aed', '--navbar-bg': '#ffffff',
    '--hero-bg': 'linear-gradient(135deg,#ede9fe,#faf5ff)',
    '--stat-bg': 'rgba(124,58,237,0.06)',
  },
};

function applyTheme(isDark) {
  const vars = isDark ? THEMES.dark : THEMES.light;
  Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
}

export default function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('cq_dark') !== 'false');
  const [token, setToken]   = useState(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(false);

  // Appliquer thème
  useEffect(() => {
    document.body.classList.toggle('theme-light', !isDark);
    document.body.classList.toggle('theme-dark',   isDark);
    applyTheme(isDark);
    localStorage.setItem('cq_dark', isDark);
  }, [isDark]);

  // ✅ Vérifier isAdmin dès qu'on a un token
  useEffect(() => {
    if (!token) { setIsAdmin(false); return; }

    // Méthode 1 : décoder le JWT
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.is_staff || payload.is_superuser) {
        setIsAdmin(true);
        return;
      }
    } catch {}

    // Méthode 2 : appel API /profil/ pour récupérer is_staff
    fetch('/api/profil/', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setIsAdmin(data.is_staff === true || data.is_superuser === true);
      })
      .catch(() => setIsAdmin(false));
  }, [token]);

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAdmin(false);
  };

  const toggleBtn = (
    <button
      className="theme-toggle-btn"
      onClick={() => setIsDark(d => !d)}
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );

  if (!token) {
    return (
      <BrowserRouter>
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 9999 }}>
          {toggleBtn}
        </div>
        <Routes>
          <Route path="/login"    element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="*"         element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Navbar
        onLogout={handleLogout}
        isAdmin={isAdmin}
        toggleBtn={toggleBtn}
      />
      <div className="app-content">
        <Routes>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/quetes"     element={<Quetes />} />
          <Route path="/profil"     element={<Profil />} />
          <Route path="/classement" element={<Classement />} />
          {/* ✅ Route admin toujours présente, même si le lien est caché */}
          <Route path="/admin"      element={<AdminPanel />} />
          <Route path="*"           element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}