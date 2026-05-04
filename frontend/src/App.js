import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getProfil } from './services/api';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profil from './pages/Profil';
import Quetes from './pages/Quetes';
import Classement from './pages/Classement';
import AdminPanel from './pages/AdminPanel';
import Navbar from './components/Navbar';
import './App.css';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      getProfil()
        .then(r => setUser(r.data))
        .catch(() => {});
    }
  }, [isLoggedIn]);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
  };

  const isAdmin = user?.is_formateur || user?.is_staff;

  return (
    <BrowserRouter>
      {isLoggedIn && <Navbar onLogout={handleLogout} isAdmin={isAdmin} />}
      <Routes>
        <Route path="/login"      element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
        <Route path="/register"   element={isLoggedIn ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard"  element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/profil"     element={isLoggedIn ? <Profil /> : <Navigate to="/login" />} />
        <Route path="/quetes"     element={isLoggedIn ? <Quetes /> : <Navigate to="/login" />} />
        <Route path="/classement" element={isLoggedIn ? <Classement /> : <Navigate to="/login" />} />
        <Route path="/admin"      element={isLoggedIn && isAdmin ? <AdminPanel /> : <Navigate to="/dashboard" />} />
        <Route path="*"           element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
