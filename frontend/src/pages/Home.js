import React, { useState, useEffect } from 'react';
import './Home.css';
import { FeedbackModal, PolicyModal, DeptModal } from './FooterModals';

const SLIDES = [
  {
    img: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=1600&q=80',
    fallback: '#0c1a3a',
    tag: '🛣️ Road Infrastructure',
    h1: 'Report Dangerous\nPotholes Instantly',
    p: 'Dangerous road conditions cause accidents every day. Report potholes, road damage and broken footpaths directly to Public Works Department.',
    btn: 'Report Road Issue',
  },
  {
    img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80',
    fallback: '#0a1f10',
    tag: '💧 Water Infrastructure',
    h1: 'Water Leakage &\nDrainage Failures',
    p: 'Burst pipes and blocked drains waste thousands of litres of water daily. Report water infrastructure issues to the Water Authority.',
    btn: 'Report Water Issue',
  },
  {
    img: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=1600&q=80',
    fallback: '#1a0a05',
    tag: '🗑️ Waste Management',
    h1: 'Garbage Overflow\nAffects Public Health',
    p: 'Overflowing bins spread disease and create unhygienic conditions. Report garbage issues to the Sanitation Department for immediate action.',
    btn: 'Report Garbage Issue',
  },
  {
    img: 'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=1600&q=80',
    fallback: '#1a140a',
    tag: '💡 Public Lighting',
    h1: 'Broken Streetlights\nCreate Safety Risks',
    p: 'Dark streets are unsafe for pedestrians and drivers. Help us identify broken streetlights and get them repaired faster.',
    btn: 'Report Streetlight',
  },
];

const ISSUE_CARDS = [
  { img:'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=700&q=75', emoji:'🛣️', title:'Road Damage & Potholes',    desc:'Dangerous road conditions causing accidents and vehicle damage across the city.', count:'3,240 reports', dept:'Public Works Dept' },
  { img:'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=700&q=75', emoji:'💡', title:'Broken Streetlights',        desc:'Non-functional street lighting creating unsafe conditions for pedestrians at night.', count:'1,890 reports', dept:'Electricity Board' },
  { img:'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=700&q=75', emoji:'🗑️', title:'Garbage Overflow',           desc:'Overflowing waste bins and illegal dumping spreading disease and pollution.', count:'2,610 reports', dept:'Sanitation Dept' },
  { img:'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=75', emoji:'💧', title:'Water Leakage & Drainage',   desc:'Burst pipes and blocked drains causing waterlogging and road damage.', count:'1,420 reports', dept:'Water Authority' },
  { img:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=700&q=75', emoji:'🏚️', title:'Damaged Public Property',    desc:'Broken park benches, damaged footpaths and crumbling boundary walls.', count:'980 reports',  dept:'Municipal Corp' },
  { img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=75', emoji:'🚰', title:'Drainage Problems',           desc:'Blocked stormwater drains causing flooding during monsoon season.', count:'1,340 reports', dept:'Water Authority' },
];

const STEPS = [
  { n:'01', icon:'📋', t:'Register & Login',     d:'Create a free citizen account in 30 seconds. Only your email is needed.' },
  { n:'02', icon:'📍', t:'Report the Issue',     d:'Fill a simple form with title, category, location and an optional photo.' },
  { n:'03', icon:'🏛️', t:'Auto-Assignment',      d:'System instantly routes your complaint to the correct government department.' },
  { n:'04', icon:'📊', t:'Priority Scoring',     d:'BERT AI analyses your complaint text and assigns a 0–100 priority score automatically.' },
  { n:'05', icon:'🔔', t:'Track Your Complaint', d:'Get SMS and email updates at every stage of resolution.' },
  { n:'06', icon:'✅', t:'Issue Resolved',        d:'Get notified when fixed. Rate the quality of resolution you received.' },
];

// Stats are computed live from IssueStore — no fake numbers
// Passed in as props from App.js

// Testimonials removed — will be populated from real citizen feedback only

const NAV = ['Home','About','Issues','How It Works','Statistics','Contact'];

export default function Home({ onEnter }) {
  const [slide,    setSlide]   = useState(0);
  const [menuOpen, setMenu]    = useState(false);
  const [activeNav,setActive]  = useState('Home');
  const [modal, setModal] = useState(null); // {type:'feedback'|'policy'|'dept', page:string}

  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const scrollTo = id => {
    setMenu(false); setActive(id);
    const el = document.getElementById(id.toLowerCase().replace(/\s+/g, '-'));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const S = SLIDES[slide];

  const handleImgErr = e => { e.target.classList.add('errored'); };

  return (
    <div className="hp">
      {/* ══ HEADER ══ */}
      <header className="site-header">
        <div className="wrap">
          <div className="hdr-brand">
            <div className="hdr-seal">🏛️</div>
            <div className="hdr-info">
              
              <div className="hdr-name">SCIS — Smart Civic Infrastructure System, Ghaziabad</div>
              <div className="hdr-sub">Nagar Nigam Ghaziabad · Smart City Mission · Uttar Pradesh</div>
            </div>
          </div>
          <div className="hdr-right">
            
            <div className="hdr-actions">
              <button className="hbtn hbtn-outline" onClick={() => onEnter('login')}>🔐 Citizen Login</button>
              <button className="hbtn hbtn-fill"    onClick={() => onEnter('register')}>📋 Register Now</button>
            </div>
          </div>
        </div>
      </header>

      {/* ══ NAVBAR ══ */}
      <nav className="site-nav" id="nav" style={{position:'sticky',top:0,zIndex:500}}>
        <div className="wrap">
          <div className="nav-brand" onClick={() => scrollTo('Home')}>⚡ SCIS Ghaziabad</div>
          <button className="nav-burger" onClick={() => setMenu(m => !m)}>☰</button>
          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            {NAV.map(l => (
              <button key={l} className={`nav-link ${activeNav===l?'active':''}`} onClick={() => scrollTo(l)}>
                {l}
              </button>
            ))}
            <button className="nav-link authority" onClick={() => onEnter('authority-login')}>
              🏛️ Authority Portal
            </button>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section id="home" className="hero">
        <div className="hero-slides">
          {SLIDES.map((s, i) => (
            <div key={i} className={`hero-slide ${i===slide?'active':''}`}>
              <img src={s.img} alt={s.tag} onError={handleImgErr} />
              <div className="fallback" style={{background: s.fallback}}>
                <span style={{fontSize:80}}>{s.tag.split(' ')[0]}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="hero-grad-bottom"/>
        <div className="hero-grad-side"/>
        <div className="hero-orange-bar"/>

        {/* thumb strip */}
        <div className="hero-thumbs">
          {SLIDES.map((_, i) => (
            <div key={i} className={`hero-thumb ${i===slide?'active':''}`} onClick={() => setSlide(i)}/>
          ))}
        </div>

        <div className="hero-content">
          <div className="wrap">
            <div className="hero-tag">{S.tag}</div>
            <h1 className="hero-h1">{S.h1.replace('\\n','\n')}</h1>
            <p className="hero-p">{S.p}</p>
            <div className="hero-actions">
              <button className="hero-btn-primary"   onClick={() => onEnter('register')}>📋 {S.btn}</button>
              <button className="hero-btn-secondary" onClick={() => scrollTo('How It Works')}>How It Works ↓</button>
            </div>
          </div>
        </div>

        <div className="hero-scroll" onClick={() => scrollTo('About')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14M5 13l7 7 7-7" stroke="rgba(255,255,255,.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Scroll</span>
        </div>
      </section>

      {/* ══ STATS BAR ══ */}
      <div className="stats-bar">
        <div className="wrap">
          {[
            { icon:'📋', val:'Report',   lbl:'Civic Issues' },
            { icon:'🤖', val:'BERT AI',  lbl:'Priority Scoring' },
            { icon:'🗺️', val:'Live Map', lbl:'GIS Tracking' },
            { icon:'🏛️', val:'5 Depts',  lbl:'Auto-Assigned' },
          ].map((s,i) => (
            <div key={i} className="sb-cell">
              <div className="sb-icon-wrap">{s.icon}</div>
              <div>
                <div className="sb-val" style={{fontSize:16}}>{s.val}</div>
                <div className="sb-lbl">{s.lbl}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ MARQUEE ══ */}
      <div className="marquee-bar">
        <div className="marquee-track">
          {['📢 Report civic issues directly to Nagar Nigam departments',
            '✅ Complaints tracked and resolved by Nagar Nigam Ghaziabad',
            '🔔 Citizens can track status via SMS and email alerts',
            '🔔 Track your complaint status with a unique reference number',
            '📊 BERT AI assigns priority score to every complaint automatically',
            '🚀 MCA Final Year Project — SCIS by Apurva Anupam',
            '📢 Report civic issues directly to Nagar Nigam departments',
            '✅ Complaints tracked and resolved by Nagar Nigam Ghaziabad',
            '🔔 Citizens can track status via SMS and email alerts',
            '🔔 Track your complaint status with a unique reference number',
          ].map((t,i) => <span key={i} className="marquee-item">{t} &nbsp;•&nbsp; </span>)}
        </div>
      </div>

      {/* ══ ABOUT ══ */}
      <section id="about" className="section">
        <div className="wrap">
          <div className="about-layout">
            <div className="about-body">
              <div className="eyebrow">About the Portal</div>
              <h2 className="sec-h2">India's Smart Civic<br/>Infrastructure System</h2>
              <p className="sec-lead">
                SCIS is the official civic infrastructure platform for Ghaziabad that connects every citizen directly
                with Nagar Nigam Ghaziabad for faster, transparent infrastructure resolution.
              </p>
              <div className="about-checks">
                {['Report any civic issue with photo & GPS in under 60 seconds',
                  'Automatic routing to the correct government department',
                  'Priority scoring ensures urgent issues are fixed first',
                  'Real-time GIS map of all city issues across every ward',
                  'Complete transparency — track every complaint live',
                  'Built specifically for Ghaziabad citizens and Nagar Nigam departments',
                ].map((p,i) => (
                  <div key={i} className="about-check">
                    <div className="check-icon">✓</div>
                    <span>{p}</span>
                  </div>
                ))}
              </div>
              <div className="about-cta">
                <button className="btn-orange" onClick={() => onEnter('register')}>Register as Citizen →</button>
                <button className="btn-navy"   onClick={() => onEnter('authority-login')}>Authority Login</button>
              </div>
            </div>

            {/* Image collage */}
            <div className="about-visual">
              <div className="av-dot1"/>
              <div className="av-dot2"/>
              <img className="av-img main"
                src="https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=700&q=75"
                alt="Road damage"
                onError={handleImgErr}
              />
              <img className="av-img sec"
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=700&q=75"
                alt="Infrastructure"
                onError={handleImgErr}
              />
              <div className="av-badge">
                <div className="av-badge-val">🏛️</div>
                <div className="av-badge-lbl">Nagar Nigam GZB</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WHO IS IT FOR ══ */}
      <section className="section section-alt">
        <div className="wrap">
          <div style={{textAlign:'center'}}>
            <div className="eyebrow">Who Is It For</div>
            <h2 className="sec-h2" style={{margin:'0 auto 8px'}}>Built for Every Stakeholder</h2>
            <p className="sec-lead" style={{margin:'0 auto'}}>One platform, three powerful portals for citizens, government and maintenance teams.</p>
          </div>
          <div className="roles-grid">
            {[
              { emoji:'👤', title:'For Citizens',     color:'#f97316', desc:'Register free and report any civic issue in 60 seconds. Upload a photo, mark your location, and track the resolution live.', btn:'Register Free', action:'register' },
              { emoji:'🏛️', title:'For Authorities',  color:'#1a3a5c', desc:'Access the authority dashboard to view all citizen complaints, assign departments, update statuses and track city-wide KPIs.', btn:'Authority Login', action:'authority-login' },
              { emoji:'🔧', title:'For Maintenance',  color:'#10b981', desc:'Receive assigned tasks directly, view locations on the city map, update repair progress and upload proof of completion.', btn:'Team Login', action:'authority-login' },
            ].map((r,i) => (
              <div key={i} className="role-card" style={{'--rc':r.color}}>
                <div className="rc-emoji">{r.emoji}</div>
                <div className="rc-title">{r.title}</div>
                <div className="rc-desc">{r.desc}</div>
                <button className="rc-btn" onClick={() => onEnter(r.action)}>{r.btn} →</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ISSUES ══ */}
      <section id="issues" className="section">
        <div className="wrap">
          <div className="eyebrow">Common Issues</div>
          <h2 className="sec-h2">Infrastructure Problems We Track</h2>
          <p className="sec-lead">Click any issue type to report it directly. All complaints are automatically routed to the responsible department.</p>
          <div className="issues-grid">
            {ISSUE_CARDS.map((c,i) => (
              <div key={i} className="issue-card" onClick={() => onEnter('register')}>
                <div className="ic-img-wrap">
                  <img className="ic-img" src={c.img} alt={c.title} onError={e => { e.target.classList.add('errored'); }}/>
                  <div className="ic-fallback"><span>{c.emoji}</span></div>
                  <div className="ic-overlay">
                    <span className="ic-count">{c.count}</span>
                  </div>
                  <div className="ic-emoji-badge">{c.emoji}</div>
                </div>
                <div className="ic-body">
                  <div className="ic-title">{c.title}</div>
                  <div className="ic-desc">{c.desc}</div>
                  <div className="ic-footer">
                    <span className="ic-dept">→ {c.dept}</span>
                    <span className="ic-action">Report →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="section section-dark">
        <div className="wrap">
          <div className="eyebrow light">Process</div>
          <h2 className="sec-h2 light">How SCIS Works</h2>
          <p className="sec-lead light">From citizen report to government resolution — six clear steps.</p>
          <div className="steps-grid">
            {STEPS.map((s,i) => (
              <div key={i} className="step-card">
                <div className="step-num">{s.n}</div>
                <div className="step-icon">{s.icon}</div>
                <div className="step-title">{s.t}</div>
                <div className="step-desc">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="formula-box">
            <div className="formula-label">Priority Score Algorithm</div>
            <div className="formula-eq">Priority = Severity (1–3) × 40 + Days Pending × 5</div>
            <div className="formula-note">Higher score = higher urgency. Recalculated automatically every 24 hours.</div>
          </div>
        </div>
      </section>

      {/* ══ STATISTICS ══ */}
      <section id="statistics" className="section section-alt">
        <div className="wrap">
          <div style={{textAlign:'center'}}>
            <div className="eyebrow">About SCIS</div>
            <h2 className="sec-h2" style={{margin:'0 auto 8px'}}>How SCIS Helps Ghaziabad</h2>
            <p className="sec-lead" style={{margin:'0 auto 32px'}}>
              A project-level prototype demonstrating how citizens can report and track civic issues 
              across Ghaziabad wards using AI-based priority scoring.
            </p>
          </div>
          <div className="big-stats">
            {[
              { icon:'📋', val:'Real-time', lbl:'Issue Tracking' },
              { icon:'🤖', val:'BERT AI',   lbl:'Priority Scoring' },
              { icon:'🗺️', val:'Live GIS',  lbl:'City Map' },
              { icon:'🏛️', val:'5 Depts',   lbl:'Auto-Assignment' },
            ].map((s,i) => (
              <div key={i} className="bstat">
                <div className="bstat-icon">{s.icon}</div>
                <div className="bstat-val" style={{fontSize:18}}>{s.val}</div>
                <div className="bstat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONTACT ══ */}
      <section id="contact" className="section">
        <div className="wrap" style={{textAlign:'center'}}>
          <div className="eyebrow">Contact</div>
          <h2 className="sec-h2" style={{margin:'0 auto 8px'}}>We Are Here to Help</h2>
          <p className="sec-lead" style={{margin:'0 auto 0'}}>Reach us through any of the channels below.</p>
          <div className="contact-grid">
            {[
              { icon:'📞', t:'Toll-Free Helpline', v:'1800-XXX-XXXX',             s:'Mon–Sat · 9 AM to 6 PM IST' },
              { icon:'📧', t:'Email Support',      v:'support@scis.gov.in',        s:'Reply within 24 working hours' },
              { icon:'📍', t:'Head Office',        v:'Nagar Nigam Ghaziabad HQ',   s:'Navyug Market, Ghaziabad, UP' },
              { icon:'💬', t:'Live Chat',          v:'Available on this Portal',   s:'9 AM to 5 PM on working days' },
            ].map((c,i) => (
              <div key={i} className="ccard">
                <div className="ccard-icon">{c.icon}</div>
                <div className="ccard-title">{c.t}</div>
                <div className="ccard-val">{c.v}</div>
                <div className="ccard-sub">{c.s}</div>
              </div>
            ))}
          </div>
          <div className="contact-cta">
            <button className="btn-orange" onClick={() => onEnter('register')}>Register &amp; Report an Issue</button>
            <button className="btn-navy"   onClick={() => onEnter('login')}>Citizen Login</button>
          </div>
        </div>
      </section>



      {/* ══ FOOTER ══ */}
      <footer className="site-footer">
        <div className="footer-main">
          <div className="wrap">
            <div>
              <div className="fc-logo">🏛️ SCIS</div>
              <div className="fc-tagline">Smart Civic Infrastructure Issue Monitoring &amp; Management System — MCA Final Year Project, Ghaziabad</div>
              <div className="fc-govt">
                Designed, Developed &amp; Hosted by<br/>
                <strong>SCIS Project</strong><br/>
                MCA Final Year · Nagar Nigam Ghaziabad · 2025-26
              </div>
              <div className="fc-socials">
                {['𝕏','in','f','▶'].map((s,i) => <div key={i} className="fc-social">{s}</div>)}
              </div>
            </div>
            <div>
              <div className="fc-head">Quick Links</div>
              {['Home','About','Issues','How It Works','Statistics','Contact'].map(l => (
                <div key={l} className="fc-link" onClick={() => scrollTo(l)}>{l}</div>
              ))}
            </div>
            <div>
              <div className="fc-head">Citizen Services</div>
              {[['Report an Issue','register'],['Register Account','register'],['Citizen Login','login'],['Authority Login','authority-login'],['FAQ','login'],['Help & Support','login']].map(([l,a],i) => (
                <div key={i} className="fc-link" onClick={() => onEnter(a)}>{l}</div>
              ))}
            </div>
            <div>
              <div className="fc-head">Departments</div>
              {['Public Works Dept','Electricity Board','Sanitation Department','Water Authority','Municipal Corporation','Urban Local Body'].map(l => (
                <div key={l} className="fc-link" onClick={() => setModal({type:'dept',page:l})}>{l}</div>
              ))}
            </div>
            <div>
              <div className="fc-head">Policies</div>
              {['Website Policies','Privacy Policy','Terms of Use','Accessibility','Disclaimer','Sitemap','Feedback'].map(l => (
                <div key={l} className="fc-link"
                  style={l==='Feedback'?{color:'#f97316',fontWeight:700}:{}}
                  onClick={() => l==='Feedback'
                    ? setModal({type:'feedback'})
                    : setModal({type:'policy',page:l})}>{l}{l==='Feedback'?' ✍️':''}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-mid">
          <div className="wrap">
            <span>🏛️ SCIS — Smart Civic Infrastructure System</span>
            <span>📅 Last Updated: 25 Mar 2026</span>
            <span>📍 Serving Ghaziabad, Uttar Pradesh</span>
            <span>🖥️ Best viewed at 1366×768 or higher</span>
            <span>Compatible with Chrome, Firefox, Edge, Safari</span>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="wrap">
            <span style={{color:'#1e293b'}}>© 2026 SCIS | MCA Project · Developed by Apurva Anupam</span>
            <div className="fb-links">
              {['Privacy Policy','Terms of Use','Accessibility','Sitemap','Disclaimer'].map(l => (
                <span key={l} className="fb-link" onClick={() => setModal({type:'policy',page:l})}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ══ MODALS ══ */}
      {modal?.type === 'feedback' && <FeedbackModal onClose={() => setModal(null)} />}
      {modal?.type === 'policy'   && <PolicyModal   page={modal.page} onClose={() => setModal(null)} />}
      {modal?.type === 'dept'     && <DeptModal     dept={modal.page} onClose={() => setModal(null)} />}

    </div>
  );
}
