import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

export default function Login({ onLogin, onSwitch, onBack }) {
  const [form, setForm]     = useState({ email:'', password:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const h = e => setForm(f => ({...f, [e.target.name]:e.target.value}));

  const submit = async e => {
    e.preventDefault(); setError('');
    if (!form.email || !form.password) { setError('Please fill all fields'); return; }
    setLoading(true);
    try {
      const r = await axios.post('/api/auth/login', form);
      onLogin(r.data.user || { name:form.email.split('@')[0], role:'Citizen', email:form.email });
    } catch {
      if (form.password.length >= 4) onLogin({ name:form.email.split('@')[0], role:'Citizen', email:form.email });
      else setError('Use any email + password (min 4 chars)');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="ab1"/><div className="ab2"/></div>
      <div className="auth-card">
        <button className="auth-back" onClick={onBack}>← Back to Home</button>
        <div className="auth-logo">⚡ Civic<b>Watch</b></div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to monitor city infrastructure</p>
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={h}/></div>
          <div className="form-group"><label className="form-label">Password</label>
            <input className="form-input" type="password" name="password" placeholder="Min 4 characters" value={form.password} onChange={h}/></div>
          {error && <div className="form-error" style={{marginBottom:10}}>{error}</div>}
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
        <div className="auth-hint">💡 Demo: any email + any password (4+ chars)</div>
        <p className="auth-switch">No account? <span className="auth-link" onClick={onSwitch}>Register here</span></p>
      </div>
    </div>
  );
}
