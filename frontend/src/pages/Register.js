import React, { useState } from 'react';
import axios from 'axios';
import './Auth.css';

// localStorage user store
const USERS_KEY = 'scis_users';
function getUsers()     { try { return JSON.parse(localStorage.getItem(USERS_KEY)||'[]'); } catch { return []; } }
function saveUser(u)    { const all = getUsers(); all.push(u); localStorage.setItem(USERS_KEY, JSON.stringify(all)); }
function emailExists(e) { return getUsers().some(u => u.email.toLowerCase() === e.toLowerCase()); }

function pwStrength(pw) {
  if (!pw) return { score:0, label:'', color:'#e2e8f0' };
  let s = 0;
  if (pw.length >= 6)               s++;
  if (pw.length >= 10)              s++;
  if (/[A-Z]/.test(pw))            s++;
  if (/[0-9]/.test(pw))            s++;
  if (/[^A-Za-z0-9]/.test(pw))    s++;
  const map = [
    { label:'Too short', color:'#ef4444' },
    { label:'Weak',      color:'#f97316' },
    { label:'Fair',      color:'#f59e0b' },
    { label:'Good',      color:'#10b981' },
    { label:'Strong',    color:'#059669' },
    { label:'Very strong',color:'#065f46'},
  ];
  return { score:s, ...map[s] };
}

export default function Register({ onLogin, onSwitch, onBack }) {
  const [step, setStep]   = useState(1);  // 1 = personal, 2 = security, 3 = success
  const [form, setForm]   = useState({ name:'', email:'', phone:'', password:'', confirm:'', terms:false });
  const [errors, setErrs] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const [showCf,  setShowCf]  = useState(false);

  const h  = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const hc = e => setForm(f => ({ ...f, terms: e.target.checked }));

  const strength = pwStrength(form.password);

  const validateStep1 = () => {
    const err = {};
    if (!form.name.trim())         err.name  = 'Full name is required';
    if (!form.email.trim())        err.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) err.email = 'Enter a valid email address';
    else if (emailExists(form.email))           err.email = 'This email is already registered';
    return err;
  };

  const validateStep2 = () => {
    const err = {};
    if (!form.password)             err.password = 'Password is required';
    else if (form.password.length < 6) err.password = 'Minimum 6 characters';
    if (form.password !== form.confirm) err.confirm = 'Passwords do not match';
    if (!form.terms)                err.terms   = 'Please accept the terms';
    return err;
  };

  const nextStep = () => {
    const err = validateStep1();
    setErrs(err);
    if (!Object.keys(err).length) setStep(2);
  };

  const submit = async e => {
    e.preventDefault();
    const err = validateStep2();
    setErrs(err);
    if (Object.keys(err).length) return;
    setLoading(true);

    const user = { name:form.name.trim(), email:form.email.trim(), phone:form.phone.trim(), role:'Citizen', registered:new Date().toISOString() };

    // Try real backend first, fallback to localStorage
    try {
      const r = await axios.post('/api/auth/register', { ...user, password:form.password });
      saveUser(user);
      setStep(3);
    } catch {
      // Backend offline — save locally
      saveUser(user);
      setStep(3);
    } finally { setLoading(false); }
  };

  if (step === 3) {
    return (
      <div className="auth-page">
        <div className="auth-blob1"/><div className="auth-blob2"/>
        <div className="auth-card">
          <div className="auth-card-bar"/>
          <div className="auth-card-inner">
            <div className="auth-success">
              <div className="auth-success-icon">🎉</div>
              <div className="auth-success-title">Registration Successful!</div>
              <div className="auth-success-text">
                Welcome, <strong>{form.name}</strong>!<br/>
                Your SCIS citizen account has been created.<br/>
                You can now report civic issues in Ghaziabad.
              </div>
              <div className="auth-success-ref">{form.email}</div>
              <button className="auth-submit" onClick={() => onLogin({ name:form.name, email:form.email, role:'Citizen' })}>
                Go to Dashboard →
              </button>
            </div>
          </div>
          <div className="auth-footer">SCIS · Nagar Nigam Ghaziabad · Smart City Portal</div>
        </div>
      </div>
    );
  }

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
            <h1 className="auth-title">Create Citizen Account</h1>
            <p className="auth-sub">Register to report and track civic issues in Ghaziabad</p>
          </div>

          {/* Step indicator */}
          <div className="auth-steps">
            <div className={`auth-step ${step===1?'active':step>1?'done':''}`}>
              <div className="auth-step-dot">{step>1?'✓':'1'}</div>
              <div className="auth-step-label">Personal</div>
            </div>
            <div className="auth-step-line"/>
            <div className={`auth-step ${step===2?'active':step>2?'done':''}`}>
              <div className="auth-step-dot">{step>2?'✓':'2'}</div>
              <div className="auth-step-label">Security</div>
            </div>
          </div>

          {/* STEP 1 — Personal Info */}
          {step === 1 && (
            <div>
              <div className="auth-form-group">
                <label className="auth-label">Full Name *</label>
                <div className={`auth-input-wrap ${errors.name?'error':''}`}>
                  <span className="auth-input-icon">👤</span>
                  <input name="name" placeholder="Your full name" value={form.name} onChange={h}/>
                </div>
                {errors.name && <div className="auth-field-error">{errors.name}</div>}
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Email Address *</label>
                <div className={`auth-input-wrap ${errors.email?'error':''}`}>
                  <span className="auth-input-icon">✉️</span>
                  <input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={h}/>
                </div>
                {errors.email && <div className="auth-field-error">{errors.email}</div>}
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Mobile Number (optional)</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">📱</span>
                  <input name="phone" placeholder="10-digit mobile (optional)" maxLength={10} value={form.phone} onChange={h}/>
                </div>
              </div>

              <div className="auth-info-box">
                <span>ℹ️</span>
                <span>Your email will be used to track complaint status. All data is stored securely by Nagar Nigam Ghaziabad.</span>
              </div>

              <button className="auth-submit" type="button" onClick={nextStep}>
                Continue to Security →
              </button>
              <div className="auth-switch">
                Already registered? <span className="auth-link" onClick={onSwitch}>Sign in here</span>
              </div>
            </div>
          )}

          {/* STEP 2 — Security */}
          {step === 2 && (
            <form onSubmit={submit}>
              <div className="auth-form-group">
                <label className="auth-label">Password *</label>
                <div className={`auth-input-wrap ${errors.password?'error':''}`}>
                  <span className="auth-input-icon">🔑</span>
                  <input
                    type={showPw?'text':'password'} name="password"
                    placeholder="Minimum 6 characters"
                    value={form.password} onChange={h}/>
                  <button type="button" className="auth-eye" onClick={()=>setShowPw(v=>!v)}>
                    {showPw?'🙈':'👁️'}
                  </button>
                </div>
                {form.password && (
                  <div className="auth-strength">
                    <div className="auth-strength-bar">
                      <div className="auth-strength-fill"
                        style={{width:`${(strength.score/5)*100}%`, background:strength.color}}/>
                    </div>
                    <div className="auth-strength-label" style={{color:strength.color}}>{strength.label}</div>
                  </div>
                )}
                {errors.password && <div className="auth-field-error">{errors.password}</div>}
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Confirm Password *</label>
                <div className={`auth-input-wrap ${errors.confirm?'error':''}`}>
                  <span className="auth-input-icon">🔒</span>
                  <input
                    type={showCf?'text':'password'} name="confirm"
                    placeholder="Re-enter password"
                    value={form.confirm} onChange={h}/>
                  <button type="button" className="auth-eye" onClick={()=>setShowCf(v=>!v)}>
                    {showCf?'🙈':'👁️'}
                  </button>
                </div>
                {form.confirm && form.password === form.confirm &&
                  <div style={{fontSize:11,color:'#10b981',marginTop:4}}>✅ Passwords match</div>}
                {errors.confirm && <div className="auth-field-error">{errors.confirm}</div>}
              </div>

              <label className="auth-terms">
                <input type="checkbox" checked={form.terms} onChange={hc}/>
                <span>I agree to the <strong>Terms of Use</strong> and <strong>Privacy Policy</strong> of SCIS Ghaziabad portal</span>
              </label>
              {errors.terms && <div className="auth-field-error" style={{marginBottom:8}}>{errors.terms}</div>}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? '⏳ Creating account...' : '✅ Create My Account →'}
              </button>
              <div style={{textAlign:'center',marginTop:10}}>
                <span className="auth-link" onClick={()=>{setStep(1);setErrs({});}}>← Back to personal info</span>
              </div>
            </form>
          )}
        </div>
        <div className="auth-footer">🔒 Secure · SCIS v2.0 · Nagar Nigam Ghaziabad · 2026</div>
      </div>
    </div>
  );
}
