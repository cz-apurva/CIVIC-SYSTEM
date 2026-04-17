import React, { useState } from 'react';
import './FooterModals.css';

/* ═══════════════════════════════════════
   FEEDBACK FORM
═══════════════════════════════════════ */
export function FeedbackModal({ onClose }) {
  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [form, setForm] = useState({
    type: '', name: '', email: '', phone: '',
    subject: '', message: '', rating: 0, anonymous: false,
  });
  const [errors, setErrors] = useState({});

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const hCheck = e => setForm(f => ({ ...f, [e.target.name]: e.target.checked }));

  const validate = () => {
    const err = {};
    if (!form.type)    err.type    = 'Please select feedback type';
    if (!form.subject) err.subject = 'Subject is required';
    if (!form.message) err.message = 'Please write your feedback';
    if (!form.rating)  err.rating  = 'Please give a rating';
    if (!form.anonymous && !form.email) err.email = 'Email is required (or submit anonymously)';
    return err;
  };

  const submit = e => {
    e.preventDefault();
    const err = validate();
    if (Object.keys(err).length) { setErrors(err); return; }
    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('scisFeedback') || '[]');
    saved.push({ ...form, id: 'FB' + Date.now(), date: new Date().toLocaleDateString('en-IN') });
    localStorage.setItem('scisFeedback', JSON.stringify(saved));
    setStep(2);
  };

  return (
    <div className="fm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fm-box">

        {step === 1 ? (
          <>
            <div className="fm-head">
              <div>
                <div className="fm-title">📝 Citizen Feedback</div>
                <div className="fm-sub">Your feedback helps us improve the SCIS portal</div>
              </div>
              <button className="fm-close" onClick={onClose}>✕</button>
            </div>

            <form onSubmit={submit} className="fm-form">

              {/* Feedback Type */}
              <div className="fm-field">
                <label>Feedback Type *</label>
                <div className="type-grid">
                  {[
                    { val:'complaint',   icon:'⚠️',  label:'Complaint'    },
                    { val:'suggestion',  icon:'💡',  label:'Suggestion'   },
                    { val:'compliment',  icon:'👍',  label:'Compliment'   },
                    { val:'query',       icon:'❓',  label:'General Query' },
                  ].map(t => (
                    <div key={t.val}
                      className={`type-chip ${form.type === t.val ? 'selected' : ''}`}
                      onClick={() => setForm(f => ({ ...f, type: t.val }))}>
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>
                {errors.type && <div className="fm-error">{errors.type}</div>}
              </div>

              {/* Star Rating */}
              <div className="fm-field">
                <label>Overall Portal Experience *</label>
                <div className="star-row">
                  {[1,2,3,4,5].map(n => (
                    <span key={n}
                      className={`star ${form.rating >= n ? 'active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, rating: n }))}>
                      ★
                    </span>
                  ))}
                  {form.rating > 0 && (
                    <span className="star-label">
                      {['','Poor','Fair','Good','Very Good','Excellent'][form.rating]}
                    </span>
                  )}
                </div>
                {errors.rating && <div className="fm-error">{errors.rating}</div>}
              </div>

              {/* Subject */}
              <div className="fm-field">
                <label>Subject *</label>
                <input name="subject" placeholder="Brief subject of your feedback"
                  value={form.subject} onChange={h}/>
                {errors.subject && <div className="fm-error">{errors.subject}</div>}
              </div>

              {/* Message */}
              <div className="fm-field">
                <label>Your Feedback / Message *</label>
                <textarea name="message" rows={4}
                  placeholder="Please describe your feedback, suggestion or complaint in detail..."
                  value={form.message} onChange={h}/>
                {errors.message && <div className="fm-error">{errors.message}</div>}
              </div>

              {/* Personal Info */}
              <div className="fm-anon-row">
                <label className="fm-checkbox">
                  <input type="checkbox" name="anonymous" checked={form.anonymous} onChange={hCheck}/>
                  <span>Submit anonymously (your name and contact will not be recorded)</span>
                </label>
              </div>

              {!form.anonymous && (
                <div className="fm-two-col">
                  <div className="fm-field">
                    <label>Full Name</label>
                    <input name="name" placeholder="Your full name" value={form.name} onChange={h}/>
                  </div>
                  <div className="fm-field">
                    <label>Email Address *</label>
                    <input type="email" name="email" placeholder="your@email.com" value={form.email} onChange={h}/>
                    {errors.email && <div className="fm-error">{errors.email}</div>}
                  </div>
                  <div className="fm-field">
                    <label>Phone Number (optional)</label>
                    <input name="phone" placeholder="10-digit mobile number" value={form.phone} onChange={h}/>
                  </div>
                  <div className="fm-field">
                    <label>Related Complaint ID (if any)</label>
                    <input name="complaintId" placeholder="e.g. SCIS-2026-001234"
                      value={form.complaintId||''} onChange={h}/>
                  </div>
                </div>
              )}

              <div className="fm-actions">
                <button type="button" className="fm-btn-cancel" onClick={onClose}>Cancel</button>
                <button type="submit" className="fm-btn-submit">Submit Feedback →</button>
              </div>
            </form>
          </>
        ) : (
          <div className="fm-success">
            <div className="fm-success-icon">✅</div>
            <div className="fm-success-title">Thank You for Your Feedback!</div>
            <div className="fm-success-msg">
              Your feedback has been recorded successfully. We review all submissions to improve the SCIS portal.
              {!form.anonymous && form.email && ` A confirmation has been sent to ${form.email}.`}
            </div>
            <div className="fm-success-id">Reference ID: FB{Date.now().toString().slice(-8)}</div>
            <button className="fm-btn-submit" style={{marginTop:20}} onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   GENERIC POLICY / INFO MODAL
═══════════════════════════════════════ */
const POLICY_CONTENT = {
  'Website Policies': {
    icon: '🔏',
    sections: [
      { title: 'Copyright Policy', content: 'All content on this portal is the property of the Government of India. Reproduction is permitted for non-commercial purposes with proper attribution to the National Informatics Centre (NIC).' },
      { title: 'Hyperlink Policy', content: 'Links to external websites do not constitute endorsement by the Government of India. We are not responsible for the content of external sites.' },
      { title: 'Content Archival Policy', content: 'Content on this portal is reviewed and updated regularly. Archived content is retained for reference purposes as per Government of India guidelines.' },
      { title: 'Monitoring Policy', content: 'This website is monitored for security purposes. Unauthorised attempts to upload or change information are strictly prohibited and may be punishable under the IT Act 2000.' },
    ],
  },
  'Privacy Policy': {
    icon: '🔒',
    sections: [
      { title: 'Information We Collect', content: 'We collect your name, email address, phone number, and location data only when you voluntarily submit a complaint or register as a user. This information is used solely for resolving your civic complaints.' },
      { title: 'How We Use Your Information', content: 'Your personal information is used to process complaints, send status updates, and improve the portal. It is never sold to third parties.' },
      { title: 'Data Security', content: 'All personal data is stored securely using industry-standard encryption. Access is restricted to authorised government personnel only.' },
      { title: 'Cookies', content: 'This portal uses cookies only for session management and analytics. No personally identifiable information is stored in cookies.' },
      { title: 'Your Rights', content: 'You have the right to access, correct, or request deletion of your personal data. Contact support@scis.gov.in for data-related requests.' },
    ],
  },
  'Terms of Use': {
    icon: '📋',
    sections: [
      { title: 'Acceptance of Terms', content: 'By using the SCIS portal, you agree to these Terms of Use. If you do not agree, please discontinue use of the portal immediately.' },
      { title: 'Permitted Use', content: 'This portal is provided for citizens to report civic infrastructure issues. Any commercial use, automated scraping, or misuse is strictly prohibited.' },
      { title: 'Accuracy of Information', content: 'Citizens are responsible for providing accurate complaint information. Filing false or misleading complaints may result in account suspension and legal action.' },
      { title: 'Limitation of Liability', content: 'The Government of India and NIC are not liable for any damages arising from use of this portal. Resolution timelines are indicative and not contractually binding.' },
      { title: 'Governing Law', content: 'These Terms are governed by Indian law. Any disputes shall be subject to the jurisdiction of courts in New Delhi, India.' },
    ],
  },
  'Accessibility': {
    icon: '♿',
    sections: [
      { title: 'Our Commitment', content: 'SCIS is committed to providing equal access to all citizens, including those with disabilities, in accordance with the Guidelines for Indian Government Websites (GIGW).' },
      { title: 'Standards', content: 'This portal aims to conform to WCAG 2.1 Level AA guidelines. We use semantic HTML, ARIA labels, and keyboard navigation support throughout.' },
      { title: 'Screen Reader Support', content: 'The portal is compatible with NVDA, JAWS, and other major screen readers. All images have descriptive alt text.' },
      { title: 'Text Size', content: 'Use the A- / A / A+ controls in the top strip to adjust text size for better readability.' },
      { title: 'Report an Accessibility Issue', content: 'If you encounter any accessibility barrier, please email accessibility@scis.gov.in and we will address it within 5 working days.' },
    ],
  },
  'Disclaimer': {
    icon: '⚠️',
    sections: [
      { title: 'General Disclaimer', content: 'The information on this portal is provided in good faith. The Government of India makes no representations or warranties regarding completeness, accuracy or fitness for any particular purpose.' },
      { title: 'No Liability', content: 'The Government of India accepts no liability for loss or damage caused by using this portal or relying on information contained herein.' },
      { title: 'External Links', content: 'Links to third-party websites are provided for convenience only. The Government of India does not endorse or control the content of those sites.' },
      { title: 'Virus Disclaimer', content: 'The Government of India does not guarantee that this portal is free from viruses and advises users to maintain up-to-date antivirus software.' },
    ],
  },
  'Sitemap': {
    icon: '🗺️',
    sitemap: [
      { section: 'Main Portal', links: ['Home','About SCIS','Common Issues','How It Works','Statistics','Contact Us'] },
      { section: 'Citizen Services', links: ['Register as Citizen','Citizen Login','Report an Issue','Track Complaint','Download App (Coming Soon)','FAQ'] },
      { section: 'Authority Portal', links: ['Authority Login','View All Complaints','Update Complaint Status','Department Dashboard','Statistics & Reports'] },
      { section: 'Departments', links: ['Public Works Dept','Electricity Board','Sanitation Department','Water Authority','Municipal Corporation','Urban Local Body'] },
      { section: 'Policies & Legal', links: ['Website Policies','Privacy Policy','Terms of Use','Accessibility Statement','Disclaimer','Feedback'] },
    ],
  },
};

const DEPT_INFO = {
  'Public Works Dept':       { icon:'🛣️', head:'Superintending Engineer', phone:'0120-XXX-1001', email:'pwd@scis.gov.in',        issues:['Road Damage','Potholes','Footpath Damage','Bridge Issues'] },
  'Electricity Board':       { icon:'💡', head:'Chief Electrical Engineer', phone:'0120-XXX-1002', email:'electricity@scis.gov.in', issues:['Broken Streetlights','Power Outage','Electrical Hazard','Pole Damage'] },
  'Sanitation Department':   { icon:'🗑️', head:'Chief Sanitation Officer', phone:'0120-XXX-1003', email:'sanitation@scis.gov.in',  issues:['Garbage Overflow','Illegal Dumping','Drain Cleaning','Public Toilet'] },
  'Water Authority':         { icon:'💧', head:'Chief Engineer (Water)',    phone:'0120-XXX-1004', email:'water@scis.gov.in',       issues:['Water Leakage','No Water Supply','Drainage Problem','Contaminated Water'] },
  'Municipal Corporation':   { icon:'🏛️', head:'Commissioner',             phone:'0120-XXX-1005', email:'municipal@scis.gov.in',   issues:['Public Property Damage','Park Issues','Community Hall','Boundary Wall'] },
  'Urban Local Body':        { icon:'🏙️', head:'Executive Officer',        phone:'0120-XXX-1006', email:'ulb@scis.gov.in',         issues:['Urban Planning','Building Violations','Encroachment','Zoning Issues'] },
};

export function PolicyModal({ page, onClose }) {
  const content = POLICY_CONTENT[page];
  if (!content) return null;
  return (
    <div className="fm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fm-box fm-box-wide">
        <div className="fm-head">
          <div>
            <div className="fm-title">{content.icon} {page}</div>
            <div className="fm-sub">SCIS — Smart Civic Infrastructure System · Government of India</div>
          </div>
          <button className="fm-close" onClick={onClose}>✕</button>
        </div>
        {content.sitemap ? (
          <div className="sitemap-grid">
            {content.sitemap.map((s,i) => (
              <div key={i} className="sitemap-section">
                <div className="sitemap-sec-title">{s.section}</div>
                {s.links.map((l,j) => <div key={j} className="sitemap-link">→ {l}</div>)}
              </div>
            ))}
          </div>
        ) : (
          <div className="policy-body">
            {content.sections.map((s,i) => (
              <div key={i} className="policy-section">
                <div className="policy-sec-title">{s.title}</div>
                <div className="policy-sec-text">{s.content}</div>
              </div>
            ))}
          </div>
        )}
        <div className="fm-actions" style={{borderTop:'1px solid #e2e8f0',paddingTop:16,marginTop:8}}>
          <button className="fm-btn-submit" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export function DeptModal({ dept, onClose }) {
  const info = DEPT_INFO[dept];
  if (!info) return null;
  return (
    <div className="fm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fm-box">
        <div className="fm-head">
          <div>
            <div className="fm-title">{info.icon} {dept}</div>
            <div className="fm-sub">Government Department · SCIS Portal</div>
          </div>
          <button className="fm-close" onClick={onClose}>✕</button>
        </div>
        <div className="dept-modal-body">
          <div className="dept-info-grid">
            <div className="dept-info-item">
              <div className="dept-info-label">Department Head</div>
              <div className="dept-info-val">{info.head}</div>
            </div>
            <div className="dept-info-item">
              <div className="dept-info-label">Helpline</div>
              <div className="dept-info-val" style={{color:'#f97316'}}>{info.phone}</div>
            </div>
            <div className="dept-info-item">
              <div className="dept-info-label">Email</div>
              <div className="dept-info-val" style={{color:'#1a3a5c'}}>{info.email}</div>
            </div>
          </div>
          <div className="dept-issues-section">
            <div className="dept-issues-title">Issues Handled by This Department</div>
            <div className="dept-issues-grid">
              {info.issues.map((issue,i) => (
                <div key={i} className="dept-issue-chip">{info.icon} {issue}</div>
              ))}
            </div>
          </div>
          <div className="dept-cta">
            <div className="dept-cta-text">To report an issue handled by this department:</div>
          </div>
        </div>
        <div className="fm-actions" style={{borderTop:'1px solid #e2e8f0',paddingTop:16}}>
          <button className="fm-btn-cancel" onClick={onClose}>Close</button>
          <button className="fm-btn-submit">📋 Report an Issue to This Dept →</button>
        </div>
      </div>
    </div>
  );
}
