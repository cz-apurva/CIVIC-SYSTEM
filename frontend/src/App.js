import React, { useState } from 'react';
import './App.css';
import { IssueProvider } from './IssueStore';
import Home               from './pages/Home';
import Login              from './pages/Login';
import Register           from './pages/Register';
import AuthorityLogin     from './pages/AuthorityLogin';
import Dashboard          from './pages/Dashboard';
import MapView            from './pages/MapView';
import ReportIssue        from './pages/ReportIssue';
import AuthorityDashboard from './pages/AuthorityDashboard';
import Sidebar            from './components/Sidebar';
import axios              from 'axios';

export default function App() {
  const [user,      setUser]   = useState(null);
  const [authority, setAuth]   = useState(null);
  const [screen,    setScreen] = useState('home');
  const [page,      setPage]   = useState('dashboard');

  const citizenLogin   = u => { setUser(u);  setScreen('citizen-app'); setPage('dashboard'); };
  const authorityLogin = a => { setAuth(a);  setScreen('authority-app'); };
  const logout         = () => { setUser(null); setAuth(null); setScreen('home'); };
  const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  if (screen === 'home')            return <Home            onEnter={setScreen} />;
  if (screen === 'login')           return <Login           onLogin={citizenLogin}   onSwitch={() => setScreen('register')}       onBack={() => setScreen('home')} />;
  if (screen === 'register')        return <Register        onLogin={citizenLogin}   onSwitch={() => setScreen('login')}          onBack={() => setScreen('home')} />;
  if (screen === 'authority-login') return <AuthorityLogin  onLogin={authorityLogin} onBack={() => setScreen('home')} />;

  if (screen === 'authority-app' && authority)
    return (
      <IssueProvider>
        <AuthorityDashboard authority={authority} onLogout={logout} />
      </IssueProvider>
    );

  // ── CITIZEN APP ──
  const PageComp = () => {
    if (page === 'map')    return <MapView />;
    if (page === 'report') return <ReportIssue user={user} onSuccess={() => setPage('dashboard')} />;
    if (page === 'about') {
      setTimeout(() => {
        const el = document.querySelector('.about-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 120);
      setPage('dashboard');
      return <Dashboard user={user} onNavigate={setPage} />;
    }
    return <Dashboard user={user} onNavigate={setPage} />;
  };

  return (
    <IssueProvider>
      <div className="app-shell">
        <Sidebar user={user} page={page} onNavigate={setPage} onLogout={logout} />
        <main className="app-main"><PageComp /></main>
      </div>
    </IssueProvider>
  );
}
