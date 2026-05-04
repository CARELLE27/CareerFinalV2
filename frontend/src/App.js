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

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('cq_dark') !== 'false';
  });
  const [token, setToken]     = useState(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ Applique la classe sur <body> — simple et efficace
  useEffect(() => {
    document.body.classList.toggle('theme-light', !isDark);
    document.body.classList.toggle('theme-dark', isDark);
    localStorage.setItem('cq_dark', isDark);
  }, [isDark]);

  const handleLogin = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    // Vérifier si admin
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      setIsAdmin(payload.is_staff || false);
    } catch {}
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
  };

  const toggleBtn = (
    <button
      onClick={() => setIsDark(d => !d)}
      className="theme-toggle-btn"
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );

  if (!token) {
    return (
      <BrowserRouter>
        {/* Bouton toggle en haut à droite sur pages publiques */}
        <div style={{ position:'fixed', top:'12px', right:'12px', zIndex:9999 }}>
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