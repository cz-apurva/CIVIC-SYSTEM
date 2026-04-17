import React, { useState } from 'react';
import './AuthorityLogin.css';

/* ═══════════════════════════════════════════════════════════
   OFFICIAL GOVERNMENT AUTHORITY CREDENTIALS
   All India Headquarter — Department-wise Access
   Password format: DEPT_CODE + @SCIS + YEAR
═══════════════════════════════════════════════════════════ */
const AUTHORITY_ACCOUNTS = [
  {
    id:       'SCIS-GOI-001',
    username: 'collector.gzb',
    password: 'GZB@SCIS2026',
    name:     'Sh. Rajiv Sharma',
    dept:     'District Collector Office, Ghaziabad',
    role:     'District Collector',
    access:   'full',
    hq:       'Ghaziabad, Uttar Pradesh',
    ministry: 'Ministry of Urban Development',
  },
  {
    id:       'SCIS-PWD-002',
    username: 'pwd.engineer',
    password: 'PWD@SCIS2026',
    name:     'Er. Suresh Kumar',
    dept:     'Public Works Department — National HQ',
    role:     'Chief Engineer',
    access:   'roads',
    hq:       'New Delhi, India',
    ministry: 'Ministry of Road Transport & Highways',
  },
  {
    id:       'SCIS-SAN-003',
    username: 'sanitation.hd',
    password: 'SAN@SCIS2026',
    name:     'Sh. Dinesh Yadav',
    dept:     'Sanitation Department — National HQ',
    role:     'Director, Swachh Bharat Mission',
    access:   'garbage',
    hq:       'New Delhi, India',
    ministry: 'Ministry of Housing & Urban Affairs',
  },
  {
    id:       'SCIS-WAT-004',
    username: 'water.auth',
    password: 'WAT@SCIS2026',
    name:     'Er. Priya Nair',
    dept:     'Water Authority — National HQ',
    role:     'Chief Engineer (Water Supply)',
    access:   'water',
    hq:       'New Delhi, India',
    ministry: 'Ministry of Jal Shakti',
  },
  {
    id:       'SCIS-ELB-005',
    username: 'elect.board',
    password: 'ELB@SCIS2026',
    name:     'Er. Amit Jain',
    dept:     'Electricity Board — National HQ',
    role:     'Chief Electrical Engineer',
    access:   'lights',
    hq:       'New Delhi, India',
    ministry: 'Ministry of Power',
  },
];

export default function AuthorityLogin({ onLogin, onBack }) {
  const [form,     setForm]     = useState({ username:'', password:'' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked,   setLocked]   = useState(false);

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = e => {
    e.preventDefault();
    setError('');

    if (locked) {
      setError('Account temporarily locked. Please contact your system administrator.');
      return;
    }

    if (!form.username || !form.password) {
      setError('Employee ID and password are required.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const acc = AUTHORITY_ACCOUNTS.find(
        a => a.username === form.username.trim() && a.password === form.password
      );

      if (acc) {
        setAttempts(0);
        onLogin({ ...acc, isAuthority: true, loginTime: new Date().toISOString() });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 5) {
          setLocked(true);
          setError('Too many failed attempts. Account locked. Contact: helpdesk@scis.gov.in');
        } else {
          setError(`Invalid credentials. ${5 - newAttempts} attempt(s) remaining before lockout.`);
        }
      }
      setLoading(false);
    }, 900);
  };

  return (
    <div className="al-page">
      <div className="al-bg" />

      <div className="al-card">

        {/* Back button */}
        <button className="al-back" onClick={onBack}>← Back to Portal</button>

        {/* Official Header */}
        <div className="al-gov-header">
          <div className="al-flag">🇮🇳</div>
          <div className="al-gov-text">
            <div className="al-gov-hindi">भारत सरकार — स्मार्ट नागरिक अवसंरचना प्रणाली</div>
            <div className="al-gov-eng">GOVERNMENT OF INDIA — SCIS AUTHORITY PORTAL</div>
            <div className="al-gov-sub">National Informatics Centre (NIC) · Ministry of Urban Development</div>
          </div>
          <div className="al-emblem">🏛️</div>
        </div>

        <div className="al-orange-bar" />

        {/* Security Notice */}
        <div className="al-security-notice">
          <div className="al-sn-icon">🔒</div>
          <div className="al-sn-text">
            <strong>RESTRICTED ACCESS — AUTHORISED PERSONNEL ONLY</strong><br/>
            This portal is restricted to designated government officials.
            Unauthorised access is a punishable offence under Section 43 &amp; 66 of the IT Act, 2000.
            All login activity is logged and monitored.
          </div>
        </div>

        <h2 className="al-title">Authority Login</h2>
        <p className="al-desc">
          Enter your official Employee ID and department credentials issued by NIC.
          Contact your System Administrator if you do not have access.
        </p>

        <form onSubmit={submit} autoComplete="off">

          <div className="al-field">
            <label>Employee ID / Username</label>
            <div className="al-input-wrap">
              <span className="al-input-icon">👤</span>
              <input
                name="username"
                placeholder="Enter your official Employee ID"
                value={form.username}
                onChange={h}
                autoComplete="off"
                disabled={locked}
              />
            </div>
          </div>

          <div className="al-field">
            <label>Department Password</label>
            <div className="al-input-wrap">
              <span className="al-input-icon">🔑</span>
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                placeholder="Enter your department password"
                value={form.password}
                onChange={h}
                autoComplete="new-password"
                disabled={locked}
              />
              <button
                type="button"
                className="al-toggle-pass"
                onClick={() => setShowPass(v => !v)}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className={`al-error ${locked ? 'al-error-locked' : ''}`}>
              {locked ? '🔒' : '⚠️'} {error}
            </div>
          )}

          {attempts > 0 && !locked && (
            <div className="al-attempts-bar">
              <div className="al-attempts-fill" style={{ width: `${(attempts/5)*100}%` }} />
            </div>
          )}

          <button className="al-submit" type="submit" disabled={loading || locked}>
            {loading ? (
              <span>🔄 Verifying credentials...</span>
            ) : locked ? (
              <span>🔒 Account Locked</span>
            ) : (
              <span>🔐 Login to Authority Portal</span>
            )}
          </button>

        </form>

        {/* Department Access Info */}
        <div className="al-dept-info">
          <div className="al-di-title">Department Access Levels</div>
          <div className="al-di-grid">
            {[
              { icon:'🏛️', dept:'District Collector', access:'Full Access — All departments & complaints' },
              { icon:'🛣️', dept:'Public Works Dept',  access:'Roads, Potholes, Footpath issues only' },
              { icon:'🗑️', dept:'Sanitation Dept',    access:'Garbage & waste management only' },
              { icon:'💧', dept:'Water Authority',    access:'Water leakage & drainage only' },
              { icon:'💡', dept:'Electricity Board',  access:'Streetlights & electrical only' },
            ].map((d, i) => (
              <div key={i} className="al-di-row">
                <span className="al-di-icon">{d.icon}</span>
                <div>
                  <div className="al-di-dept">{d.dept}</div>
                  <div className="al-di-access">{d.access}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help */}
        <div className="al-help">
          <div className="al-help-row">
            <span>🆘 Forgot Password?</span>
            <a href="mailto:helpdesk@scis.gov.in" className="al-help-link">helpdesk@scis.gov.in</a>
          </div>
          <div className="al-help-row">
            <span>📞 NIC Helpdesk</span>
            <span className="al-help-link">1800-111-555 (Toll Free)</span>
          </div>
          <div className="al-help-row">
            <span>🌐 Portal Version</span>
            <span style={{ color:'#94a3b8', fontSize:11 }}>SCIS v2.0 — NIC 2026</span>
          </div>
        </div>

        {/* Footer */}
        <div className="al-footer">
          🔒 256-bit SSL Encrypted &nbsp;·&nbsp; ISO 27001 Certified &nbsp;·&nbsp; GIGW Compliant &nbsp;·&nbsp; NIC Hosted
        </div>

      </div>
    </div>
  );
}
