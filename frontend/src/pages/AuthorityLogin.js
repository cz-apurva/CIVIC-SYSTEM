import React, { useState } from 'react';
import './Auth.css'; // ← same CSS as citizen login

const AUTHORITY_ACCOUNTS = [
  { id:'SCIS-GOI-001', username:'collector.gzb', password:'Admin@2026', name:'Sh. Rajiv Sharma',  dept:'District Collector Office, Ghaziabad',  role:'District Collector',             access:'full',    ministry:'Nagar Nigam Ghaziabad' },
  { id:'SCIS-PWD-002', username:'pwd.engineer',  password:'PWD@2026',   name:'Er. Suresh Kumar',  dept:'Public Works Department',                role:'Chief Engineer',                 access:'roads',   ministry:'Public Works' },
  { id:'SCIS-SAN-003', username:'sanitation.hd', password:'SAN@2026',   name:'Sh. Dinesh Yadav',  dept:'Sanitation Department',                  role:'Director, Sanitation',           access:'garbage', ministry:'Sanitation' },
  { id:'SCIS-WAT-004', username:'water.auth',    password:'WAT@2026',   name:'Er. Priya Nair',    dept:'Water Authority',                        role:'Chief Engineer (Water)',          access:'water',   ministry:'Jal Nigam' },
  { id:'SCIS-ELB-005', username:'elect.board',   password:'ELB@2026',   name:'Er. Amit Jain',     dept:'Electricity Board',                      role:'Chief Electrical Engineer',      access:'lights',  ministry:'Electricity Board' },
];

const DEPT_ACCESS = [
  { icon:'🏛️', dept:'District Collector', access:'Full access — all departments and complaints' },
  { icon:'🛣️', dept:'Public Works Dept',  access:'Road damage and pothole issues only' },
  { icon:'🗑️', dept:'Sanitation Dept',    access:'Garbage and waste management only' },
  { icon:'💧', dept:'Water Authority',    access:'Water leakage and drainage only' },
  { icon:'💡', dept:'Electricity Board',  access:'Streetlight and electrical issues only' },
];

export default function AuthorityLogin({ onLogin, onBack }) {
  const [form,     setForm]     = useState({ username:'', password:'' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked,   setLocked]   = useState(false);

  const h = e => { setForm(f=>({...f,[e.target.name]:e.target.value})); setError(''); };

  const submit = e => {
    e.preventDefault();
    if (locked) { setError('Account locked. Contact your system administrator.'); return; }

    const u = form.username.trim();
    const p = form.password.trim();
    if (!u || !p) { setError('Employee ID and password are required.'); return; }

    setLoading(true);
    setTimeout(() => {
      const acc = AUTHORITY_ACCOUNTS.find(
        a => a.username.toLowerCase() === u.toLowerCase() && a.password === p
      );
      if (acc) {
        onLogin({ ...acc, isAuthority:true, loginTime:new Date().toISOString() });
      } else {
        const n = attempts + 1;
        setAttempts(n);
        if (n >= 5) { setLocked(true); setError('Too many attempts. Account locked. Contact your administrator.'); }
        else setError(`Invalid credentials. ${5-n} attempt(s) remaining before lockout.`);
      }
      setLoading(false);
    }, 700);
  };

  return (
    <div className="auth-page">
      <div className="auth-blob1"/><div className="auth-blob2"/>
      <div className="auth-card" style={{maxWidth:500}}>
        <div className="auth-card-bar"/>
        <div className="auth-card-inner">
          <button className="auth-back" onClick={onBack}>← Back to Portal</button>

          {/* Header — same style as citizen login */}
          <div className="auth-header">
            <div className="auth-logo">
              <div className="auth-logo-icon">🏛️</div>
              <div>
                <div className="auth-logo-text">
                  <span>SCIS &nbsp;</span><span>Authority Portal</span>
                </div>
                <div className="auth-logo-sub">Nagar Nigam Ghaziabad · Official Access Only</div>
              </div>
            </div>
            <h1 className="auth-title">Authority Login</h1>
            <p className="auth-sub">Enter your Employee ID and department credentials</p>
          </div>

          {/* Security notice — compact, not alarming */}
          <div className="auth-info-box" style={{background:'#fef3c7',borderColor:'#fde68a',color:'#92400e',marginBottom:16}}>
            <span>🔒</span>
            <span><strong>Restricted access.</strong> For authorised SCIS personnel only. All logins are recorded.</span>
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {attempts > 0 && !locked && (
            <div style={{marginBottom:10}}>
              <div style={{height:3,background:'#f1f5f9',borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${(attempts/5)*100}%`,background:'#ef4444',borderRadius:2,transition:'width .3s'}}/>
              </div>
              <div style={{fontSize:10,color:'#94a3b8',marginTop:3}}>Failed attempts: {attempts}/5</div>
            </div>
          )}

          <form onSubmit={submit}>
            <div className="auth-form-group">
              <label className="auth-label">Employee ID / Username</label>
              <div className={`auth-input-wrap ${error?'error':''}`}>
                <span className="auth-input-icon">👤</span>
                <input name="username" placeholder="Enter your Employee ID"
                  value={form.username} onChange={h} disabled={locked} autoComplete="off" spellCheck="false"/>
              </div>
            </div>

            <div className="auth-form-group">
              <label className="auth-label">Department Password</label>
              <div className={`auth-input-wrap ${error?'error':''}`}>
                <span className="auth-input-icon">🔑</span>
                <input type={showPass?'text':'password'} name="password"
                  placeholder="Enter your department password"
                  value={form.password} onChange={h} disabled={locked} autoComplete="new-password"/>
                <button type="button" className="auth-eye" onClick={()=>setShowPass(v=>!v)}>
                  {showPass?'🙈':'👁️'}
                </button>
              </div>
              <div style={{fontSize:10,color:'#94a3b8',marginTop:4}}>Password is case-sensitive. Check Caps Lock.</div>
            </div>

            <button className="auth-submit" type="submit" disabled={loading||locked}>
              {loading ? '⏳ Verifying...' : locked ? '🔒 Account Locked' : '🔐 Login to Authority Portal'}
            </button>
          </form>

          {/* Department access levels — info only, no credentials */}
          <div style={{marginTop:20,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:10,padding:'14px 16px'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:.6,marginBottom:10}}>
              Department Access Levels
            </div>
            {DEPT_ACCESS.map((d,i) => (
              <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'7px 0',borderBottom:i<DEPT_ACCESS.length-1?'1px solid #f1f5f9':'none'}}>
                <span style={{fontSize:18,flexShrink:0}}>{d.icon}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:12,color:'#1e293b'}}>{d.dept}</div>
                  <div style={{fontSize:11,color:'#64748b',marginTop:1}}>{d.access}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Help */}
          <div style={{marginTop:14,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,overflow:'hidden'}}>
            {[
              ['🆘 Forgot credentials?', 'Contact your system admin'],
              ['📞 Helpdesk', '0120-2820000'],
            ].map(([l,v],i) => (
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'9px 14px',fontSize:12,color:'#475569',borderBottom:i===0?'1px solid #f1f5f9':'none'}}>
                <span>{l}</span><span style={{color:'#f97316',fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="auth-footer">🔒 SCIS v2.0 · Nagar Nigam Ghaziabad · Confidential Access</div>
      </div>
    </div>
  );
}
