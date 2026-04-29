import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profil from './pages/Profil';
import Quetes from './pages/Quetes';
import Classement from './pages/Classement';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      {isLoggedIn && <Navbar onLogout={handleLogout} />}
      <Routes>
        <Route path="/login"      element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />
        <Route path="/register"   element={isLoggedIn ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard"  element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/profil"     element={isLoggedIn ? <Profil /> : <Navigate to="/login" />} />
        <Route path="/quetes"     element={isLoggedIn ? <Quetes /> : <Navigate to="/login" />} />
        <Route path="/classement" element={isLoggedIn ? <Classement /> : <Navigate to="/login" />} />
        <Route path="*"           element={<Navigate to={isLoggedIn ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
