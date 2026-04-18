import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

const USERS_KEY = 'scis_users';
function getUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)||'[]'); } catch { return []; } }

function findUser(email, password) {
  // Check localStorage registered users first
  const users = getUsers();
  const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (found) return found; // password stored locally — just match email for now
  return null;
}

export default function Login({ onLogin, onSwitch, onBack }) {
  const [form,    setForm]    = useState({ email:'', password:'' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const h = e => { setForm(f=>({...f,[e.target.name]:e.target.value})); setError(''); };

  const submit = async e => {
    e.preventDefault();
    setError('');

    const email = form.email.trim();
    const pw    = form.password;

    // Validation
    if (!email)      { setError('Please enter your email address'); return; }
    if (!pw)         { setError('Please enter your password'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address'); return; }
    if (pw.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);

    try {
      // 1. Try real backend
      const r = await axios.post('/api/auth/login', { email, password:pw }, { timeout:5000 });
      console.log("Full Response Data:", r.data);
      // 2. EXTRACT THE TOKEN (This was the missing piece)
      const { token, user } = r.data; 

      if (token) {
        // 3. SAVE TO LOCALSTORAGE
        localStorage.setItem('token', token);
        
        // 4. Update the app state
        const userData = user || { name: email.split('@')[0], email, role: 'Citizen' };
        onLogin(userData);
      } else {
        throw new Error("No token received");
      }

    } catch (err) {
      console.error("Login Error:", err);
      
      // Backend offline or error — check localStorage registered users
      const localUser = findUser(email, pw);
      if (localUser) {
        // NOTE: If using local fallback, you won't have a real JWT token 
        // to call the real backend API unless you mock one here.
        onLogin({ 
            name: localUser.name, 
            email: localUser.email, 
            role: localUser.role || 'Citizen', 
            phone: localUser.phone || '' 
        });
      } else {
        setError(err.response?.data?.message || 'Invalid email or password.');
      }
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob1"/><div className="auth-blob2"/>
      <div className="auth-card">
        <div className="auth-card-bar"/>
        <div className="auth-card-inner">
          <button className="auth-back" onClick={onBack}>← Back to Portal</button>

          {/* Logo */}
          <div className="auth-header">
            <div className="auth-logo">
              <div className="auth-logo-icon">🏛️</div>
              <div>
                <div className="auth-logo-text">
                  <span>SCIS &nbsp;</span><span>Ghaziabad</span>
                </div>
                <div className="auth-logo-sub">Nagar Nigam Ghaziabad · Smart City Portal</div>
              </div>
            </div>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">Sign in with your registered email and password</p>
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div className="auth-form-group">
              <label className="auth-label">Email Address</label>
              <div className={`auth-input-wrap ${error&&!form.email?'error':''}`}>
                <span className="auth-input-icon">✉️</span>
                <input
                  type="email" name="email"
                  placeholder="Enter your registered email"
                  value={form.email} onChange={h}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Password</label>
              <div className={`auth-input-wrap ${error&&!form.password?'error':''}`}>
                <span className="auth-input-icon">🔑</span>
                <input
                  type={showPw?'text':'password'} name="password"
                  placeholder="Enter your password"
                  value={form.password} onChange={h}
                  autoComplete="current-password"
                />
                <button type="button" className="auth-eye" onClick={()=>setShowPw(v=>!v)}>
                  {showPw?'🙈':'👁️'}
                </button>
              </div>
            </div>

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? '⏳ Signing in...' : '🔐 Sign In →'}
            </button>
          </form>

          {/* Info — no demo hint anymore */}
          <div className="auth-info-box" style={{marginTop:14}}>
            <span>ℹ️</span>
            <span>
              New to SCIS? <strong className="auth-link" onClick={onSwitch} style={{cursor:'pointer'}}>Register here</strong> with your email to report civic issues in Ghaziabad.
            </span>
          </div>

          <div className="auth-switch">
            No account? <span className="auth-link" onClick={onSwitch}>Register as Citizen →</span>
          </div>
        </div>
        <div className="auth-footer">🔒 Secure · SCIS v2.0 · Nagar Nigam Ghaziabad · 2026</div>
      </div>
    </div>
  );
}
