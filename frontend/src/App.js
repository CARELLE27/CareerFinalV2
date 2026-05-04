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
import { getProfil } from './services/api';   // ✅ utiliser le service existant
import './App.css';

function applyTheme(isDark) {
  document.body.classList.toggle('theme-light', !isDark);
  document.body.classList.toggle('theme-dark',   isDark);
}

export default function App() {
  const [isDark,  setIsDark]  = useState(() => localStorage.getItem('cq_dark') !== 'false');
  const [token,   setToken]   = useState(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    applyTheme(isDark);
    localStorage.setItem('cq_dark', isDark);
  }, [isDark]);

  // ✅ Utilise getProfil() depuis api.js — bonne baseURL + token automatique
  useEffect(() => {
    if (!token) { setIsAdmin(false); return; }

    getProfil()
      .then(r => {
        const data = r.data;
        console.log('[CareerQuest] Profil:', data);
        const admin = !!(
          data.is_staff     === true ||
          data.is_superuser === true ||
          data.is_formateur === true
        );
        console.log('[CareerQuest] isAdmin:', admin);
        setIsAdmin(admin);
      })
      .catch(e => {
        console.error('[CareerQuest] getProfil error:', e);
        setIsAdmin(false);
      });

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
        <div style={{ position:'fixed', top:12, right:12, zIndex:9999 }}>
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
      <Navbar onLogout={handleLogout} isAdmin={isAdmin} toggleBtn={toggleBtn} />
      <div className="app-content">
        <Routes>
          <Route path="/dashboard"  element={<Dashboard />} />
          <Route path="/quetes"     element={<Quetes />} />
          <Route path="/profil"     element={<Profil />} />
          <Route path="/classement" element={<Classement />} />
          <Route path="/admin"      element={isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" />} />
          <Route path="*"           element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}