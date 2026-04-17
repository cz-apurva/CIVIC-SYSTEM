import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

export default function Register({ onLogin, onSwitch, onBack }) {
  const [form, setForm]     = useState({ name:'', email:'', password:'', role:'Citizen' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const h = e => setForm(f => ({...f, [e.target.name]:e.target.value}));

  const submit = async e => {
    e.preventDefault(); setError('');
    if (!form.name||!form.email||!form.password) { setError('Please fill all fields'); return; }
    if (form.password.length < 4) { setError('Password min 4 characters'); return; }
    setLoading(true);
    try {
      const r = await axios.post('/api/auth/register', form);
      onLogin(r.data.user || { name:form.name, role:form.role, email:form.email });
    } catch { onLogin({ name:form.name, role:form.role, email:form.email }); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="ab1"/><div className="ab2"/></div>
      <div className="auth-card">
        <button className="auth-back" onClick={onBack}>← Back to Home</button>
        <div className="auth-logo">⚡ Civic<b>Watch</b></div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Join the smart city monitoring platform</p>
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Full Name</label>
            <input className="form-input" name="name" placeholder="Your full name" value={form.name} onChange={h}/></div>
          <div className="form-group"><label className="form-label">Email</label>
            <input className="form-input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={h}/></div>
          <div className="form-group"><label className="form-label">Password</label>
            <input className="form-input" type="password" name="password" placeholder="Min 4 characters" value={form.password} onChange={h}/></div>
          <div className="form-group"><label className="form-label">Role</label>
            <select className="form-select" name="role" value={form.role} onChange={h}>
              <option>Citizen</option><option>Authority</option><option>Maintenance</option>
            </select></div>
          {error && <div className="form-error" style={{marginBottom:10}}>{error}</div>}
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
            {loading ? 'Creating…' : 'Create Account →'}
          </button>
        </form>
        <p className="auth-switch">Already registered? <span className="auth-link" onClick={onSwitch}>Sign in</span></p>
      </div>
    </div>
  );
}
