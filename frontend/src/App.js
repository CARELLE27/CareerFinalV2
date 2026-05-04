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

// ── Thèmes ────────────────────────────────────────────────
const THEMES = {
  dark: {
    '--bg-main':        '#07071a',
    '--bg-card':        '#1a1a2e',
    '--bg-card2':       '#0d0d2b',
    '--bg-input':       '#07071a',
    '--border':         '#2a1a5e',
    '--border-light':   '#333',
    '--text-main':      '#e0e0f0',
    '--text-sub':       '#a78bfa',
    '--text-muted':     '#888888',
    '--purple':         '#7c3aed',
    '--purple-light':   '#a78bfa',
    '--purple-dark':    '#5a32a3',
    '--accent':         '#fde047',
    '--green':          '#4ade80',
    '--red':            '#f87171',
    '--blue':           '#38bdf8',
    '--navbar-bg':      '#0d0d2b',
    '--hero-bg':        'linear-gradient(135deg, #1a1a40, #2d1060)',
    '--shadow':         '0 4px 20px rgba(0,0,0,0.5)',
    '--stat-bg':        'rgba(111,66,193,0.2)',
  },
  light: {
    '--bg-main':        '#f8f7ff',
    '--bg-card':        '#ffffff',
    '--bg-card2':       '#f5f3ff',
    '--bg-input':       '#ffffff',
    '--border':         '#ddd6fe',
    '--border-light':   '#e9d5ff',
    '--text-main':      '#1f2937',
    '--text-sub':       '#5b21b6',
    '--text-muted':     '#6b7280',
    '--purple':         '#7c3aed',
    '--purple-light':   '#6d28d9',
    '--purple-dark':    '#4c1d95',
    '--accent':         '#d97706',
    '--green':          '#059669',
    '--red':            '#dc2626',
    '--blue':           '#2563eb',
    '--navbar-bg':      '#ffffff',
    '--hero-bg':        'linear-gradient(135deg, #ede9fe, #faf5ff)',
    '--shadow':         '0 4px 20px rgba(124,58,237,0.1)',
    '--stat-bg':        'rgba(124,58,237,0.08)',
  },
};

function applyTheme(isDark) {
  const vars = isDark ? THEMES.dark : THEMES.light;
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

export default function App() {
  // ✅ Booléen simple : true = sombre, false = clair
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('cq_dark') !== 'false';
  });

  const [token, setToken]   = useState(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(false);

  // Appliquer le thème dès que isDark change
  useEffect(() => {
    applyTheme(isDark);
    localStorage.setItem('cq_dark', isDark);
  }, [isDark]);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  if (!token) {
    return (
      <BrowserRouter>
        {/* ✅ Toggle thème même sur les pages publiques */}
        <button
          onClick={() => setIsDark(d => !d)}
          style={{
            position: 'fixed', top: '12px', right: '12px', zIndex: 9999,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: '20px', padding: '6px 14px', cursor: 'pointer',
            color: 'var(--text-sub)', fontSize: '0.82rem', fontWeight: 700,
            fontFamily: 'inherit', boxShadow: 'var(--shadow)',
          }}
        >
          {isDark ? '☀️ Clair' : '🌙 Sombre'}
        </button>
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
        isDark={isDark}
        onToggleTheme={() => setIsDark(d => !d)}
      />
      <div className="app-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/quetes"    element={<Quetes />} />
          <Route path="/profil"    element={<Profil />} />
          <Route path="/classement"element={<Classement />} />
          <Route path="/admin"     element={<AdminPanel />} />
          <Route path="*"          element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}