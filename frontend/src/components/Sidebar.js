import React, { useState } from 'react';
import './Sidebar.css';

const NAV = [
  { key:'dashboard', icon:'📊', label:'Dashboard'   },
  { key:'report',    icon:'📋', label:'Report Issue' },
  { key:'map',       icon:'🗺️', label:'City Map'     },
  { key:'about',     icon:'ℹ️', label:'About'        },
];

export default function Sidebar({ user, page, onNavigate, onLogout }) {
  const [col, setCol] = useState(false);
  return (
    <aside className={`sidebar ${col ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <span className="logo-icon">🏛️</span>
        {!col && <span className="logo-text">SCIS<small>Smart Civic Infrastructure System</small></span>}
        <button className="collapse-btn" onClick={() => setCol(c => !c)}>{col ? '→' : '←'}</button>
      </div>
      <nav className="sidebar-nav">
        {NAV.map(n => (
          <button key={n.key} className={`nav-item ${page === n.key ? 'active' : ''}`} onClick={() => onNavigate(n.key)}>
            <span className="nav-icon">{n.icon}</span>
            {!col && <span className="nav-label">{n.label}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-row">
          <div className="avatar">{(user?.name || 'U')[0].toUpperCase()}</div>
          {!col && <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{user?.role || 'Citizen'}</div>
          </div>}
        </div>
        {!col && <button className="signout-btn" onClick={onLogout}>Sign Out</button>}
      </div>
    </aside>
  );
}
