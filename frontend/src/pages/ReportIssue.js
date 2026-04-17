import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useIssues } from '../IssueStore';
import 'leaflet/dist/leaflet.css';
import './ReportIssue.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const selectedIcon = new L.Icon({
  iconUrl:'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:[25,41], iconAnchor:[12,41], popupAnchor:[1,-34], shadowSize:[41,41],
});

const CATS = [
  'Road Damage / Pothole','Broken Streetlight','Garbage Overflow',
  'Water Leakage','Damaged Public Property','Drainage Problem','Other',
];
const DEPT_MAP = {
  'Road Damage / Pothole':  'Public Works Department',
  'Broken Streetlight':     'Electricity Board',
  'Garbage Overflow':       'Sanitation Department',
  'Water Leakage':          'Water Authority',
  'Damaged Public Property':'Municipal Corporation',
  'Drainage Problem':       'Water Authority',
  'Other':                  'Municipal Corporation',
};
const DEPT_PHONE = {
  'Public Works Department': '0120-2820001',
  'Electricity Board':       '0120-2820002',
  'Sanitation Department':   '0120-2820003',
  'Water Authority':         '0120-2820004',
  'Municipal Corporation':   '0120-2820005',
};
const DEPT_ICON = {
  'Public Works Department': '🛣️',
  'Electricity Board':       '💡',
  'Sanitation Department':   '🗑️',
  'Water Authority':         '💧',
  'Municipal Corporation':   '🏛️',
};

const CITY_CENTER = [28.6692, 77.4538];
const EMPTY = { title:'', category:'', description:'', location:'', severity:'', reporter:'', phone:'' };

function generateRefNo() {
  const y = new Date().getFullYear();
  const n = Math.floor(100000 + Math.random() * 900000);
  return `SCIS-GZB-${y}-${n}`;
}

// Send SMS via Node backend → Fast2SMS / MSG91
async function sendSMSviaBacked(phone, refNo, title, department, deptPhone) {
  try {
    const res = await fetch('/api/send-sms', {
      method:  'POST',
      headers: { 'Content-Type':'application/json' },
      body:    JSON.stringify({ phone, refNo, title, department, deptPhone }),
    });
    const data = await res.json();
    console.log('[SMS]', data);
    return data.success;
  } catch (e) {
    console.error('[SMS Error]', e);
    return false;
  }
}

function LocationPicker({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers:{ 'Accept-Language':'en' } }
    );
    const data = await res.json();
    if (data?.display_name) return data.display_name.split(',').slice(0,3).join(',').trim();
  } catch {}
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// ── TOAST COMPONENT ──
function DeptToast({ info, onClose }) {
  if (!info) return null;
  return (
    <div className="dept-toast-overlay" onClick={onClose}>
      <div className="dept-toast" onClick={e => e.stopPropagation()}>
        <div className="dt-top">
          <div className="dt-icon">{DEPT_ICON[info.dept] || '🏛️'}</div>
          <div className="dt-body">
            <div className="dt-tag">Complaint Assigned</div>
            <div className="dt-dept">{info.dept}</div>
            <div className="dt-ref">Ref No: <strong>{info.refNo}</strong></div>
          </div>
          <button className="dt-close" onClick={onClose}>✕</button>
        </div>
        <div className="dt-details">
          <div className="dt-row">
            <span className="dt-label">📋 Issue</span>
            <span className="dt-val">{info.title}</span>
          </div>
          <div className="dt-row">
            <span className="dt-label">📍 Location</span>
            <span className="dt-val">{info.location}</span>
          </div>
          <div className="dt-row">
            <span className="dt-label">📞 Dept Helpline</span>
            <span className="dt-val" style={{color:'#f97316',fontWeight:700}}>{DEPT_PHONE[info.dept]}</span>
          </div>
          {info.phone && (
            <div className="dt-row">
              <span className="dt-label">📱 SMS Sent to</span>
              <span className="dt-val" style={{color:'#10b981',fontWeight:700}}>+91-{info.phone}</span>
            </div>
          )}
        </div>
        <div className="dt-sms-note">
          {info.phone
            ? `✅ SMS confirmation sent to +91-${info.phone} with your reference number`
            : '⚠️ No phone number provided — SMS not sent'}
        </div>
        <button className="dt-ok" onClick={onClose}>Got it →</button>
      </div>
    </div>
  );
}

export default function ReportIssue({ user, onSuccess }) {
  const { addIssue }     = useIssues();
  const [form,       setForm]       = useState({ ...EMPTY, reporter: user?.name || '' });
  const [photo,      setPhoto]      = useState(null);
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [markerPos,  setMarkerPos]  = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [toastInfo,  setToastInfo]  = useState(null);   // dept assignment popup
  const [submitted,  setSubmitted]  = useState(false);

  const h = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleMapClick = async (lat, lng) => {
    setMarkerPos({ lat, lng });
    setLocLoading(true);
    const address = await reverseGeocode(lat, lng);
    setForm(f => ({ ...f, location: address }));
    setLocLoading(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude:lat, longitude:lng } = pos.coords;
      setMarkerPos({ lat, lng });
      setMapVisible(true);
      const address = await reverseGeocode(lat, lng);
      setForm(f => ({ ...f, location: address }));
      setLocLoading(false);
    }, () => setLocLoading(false));
  };

  const validate = () => {
    const err = {};
    if (!form.title.trim())       err.title       = 'Title is required';
    if (!form.category)           err.category    = 'Select a category';
    if (!form.description.trim()) err.description = 'Description is required';
    if (!markerPos)               err.location    = 'Pick a location on the map';
    if (!form.severity)           err.severity    = 'Select severity level';
    if (form.phone && !/^\d{10}$/.test(form.phone))
                                  err.phone       = 'Enter a valid 10-digit mobile number';
    return err;
  };

  const submit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    const dept   = DEPT_MAP[form.category] || 'Municipal Corporation';
    const refNo  = generateRefNo();
    const phone  = form.phone.trim();

    const issueData = {
      title:       form.title.trim(),
      category:    form.category,
      description: form.description.trim(),
      location:    form.location.trim(),
      severity:    parseInt(form.severity),
      reporter:    form.reporter || 'Anonymous',
      phone,
      department:  dept,
      refNo,
      lat:         markerPos.lat,
      lng:         markerPos.lng,
    };

    await addIssue(issueData);

    // ── Send SMS via backend (Fast2SMS / MSG91) ──
    if (phone) {
      await sendSMSviaBacked(phone, refNo, form.title.trim(), dept, DEPT_PHONE[dept]||'0120-2820000');
    }

    setLoading(false);
    setSubmitted(true);

    // ── Show department assignment toast ──
    setToastInfo({
      dept,
      refNo,
      title:    form.title.trim(),
      location: form.location.trim(),
      phone,
    });
  };

  // ── After toast closed → redirect ──
  const handleToastClose = () => {
    setToastInfo(null);
    if (submitted && onSuccess) onSuccess();
  };

  const dept = DEPT_MAP[form.category];

  return (
    <div className="page">
      {/* Toast */}
      <DeptToast info={toastInfo} onClose={handleToastClose} />

      <div className="page-header">
        <div>
          <div className="page-title">📋 Report a New Issue</div>
          <div className="page-sub">BERT AI will assign priority automatically · SMS confirmation sent to your mobile</div>
        </div>
      </div>

      <div className="ri-layout">

        {/* ── MAIN FORM ── */}
        <div className="card">
          <form onSubmit={submit}>

            {/* Row 1 */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Issue Title *</label>
                <input className="form-input" name="title"
                  placeholder="e.g. Large pothole causing accidents near school"
                  value={form.title} onChange={h}/>
                {errors.title && <div className="form-error">{errors.title}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select className="form-select" name="category" value={form.category} onChange={h}>
                  <option value="">Select category...</option>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
                {errors.category && <div className="form-error">{errors.category}</div>}
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
                Description *
                <span className="bert-hint">🤖 BERT reads this to determine priority</span>
              </label>
              <textarea className="form-textarea" name="description"
                placeholder="Describe the problem in detail — mention danger, urgency, affected people. BERT analyses your words automatically."
                value={form.description} onChange={h}/>
              {errors.description && <div className="form-error">{errors.description}</div>}
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">📍 Location * — Click map or use GPS</label>
              <div className="loc-row">
                <input className="form-input" name="location" style={{flex:1}}
                  placeholder="Click map to auto-fill address"
                  value={locLoading ? 'Getting address...' : form.location}
                  onChange={h}/>
                <button type="button" className="loc-btn" onClick={useMyLocation} disabled={locLoading}>
                  {locLoading ? '⏳' : '📡'} My Location
                </button>
                <button type="button" className={`loc-btn ${mapVisible?'loc-btn-active':''}`}
                  onClick={() => setMapVisible(v => !v)}>
                  🗺️ {mapVisible ? 'Hide Map' : 'Pick on Map'}
                </button>
              </div>
              {errors.location && <div className="form-error">{errors.location}</div>}

              {mapVisible && (
                <div className="map-picker-wrap">
                  <div className="map-picker-bar">🖱️ Click anywhere on the map to drop a pin</div>
                  <MapContainer
                    center={markerPos ? [markerPos.lat, markerPos.lng] : CITY_CENTER}
                    zoom={13} style={{height:280}} attributionControl={false}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" subdomains="abc"/>
                    <LocationPicker onPick={handleMapClick}/>
                    {markerPos && <Marker position={[markerPos.lat, markerPos.lng]} icon={selectedIcon}/>}
                  </MapContainer>
                  {markerPos && (
                    <div className="map-confirm">✅ {form.location}</div>
                  )}
                </div>
              )}
              {markerPos && !mapVisible && (
                <div className="map-confirm" style={{marginTop:6}}>✅ Pinned: {markerPos.lat.toFixed(4)}, {markerPos.lng.toFixed(4)}</div>
              )}
            </div>

            {/* Severity + Name + Phone */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Severity *</label>
                <select className="form-select" name="severity" value={form.severity} onChange={h}>
                  <option value="">Select severity...</option>
                  <option value="3">🔴 High — Urgent Safety Risk</option>
                  <option value="2">🟡 Medium — Moderate Issue</option>
                  <option value="1">🟢 Low — Minor Problem</option>
                </select>
                {errors.severity && <div className="form-error">{errors.severity}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Your Name (optional)</label>
                <input className="form-input" name="reporter"
                  placeholder="Citizen name"
                  value={form.reporter} onChange={h}/>
              </div>
            </div>

            {/* Phone number — full width with SMS note */}
            <div className="form-group">
              <label className="form-label">
                📱 Mobile Number
                <span className="sms-hint">SMS confirmation will be sent to this number</span>
              </label>
              <div className="phone-wrap">
                <div className="phone-prefix">+91</div>
                <input className="form-input phone-input" name="phone" type="tel"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={form.phone} onChange={h}/>
              </div>
              {errors.phone && <div className="form-error">{errors.phone}</div>}
              <div className="phone-note">
                📨 You will receive an SMS with your <strong>Reference Number</strong> and assigned department details
              </div>
            </div>

            {/* Photo */}
            <div className="form-group">
              <label className="form-label">Photo (optional)</label>
              <label className="upload-zone">
                <input type="file" accept="image/*" style={{display:'none'}}
                  onChange={e => setPhoto(e.target.files[0])}/>
                {photo
                  ? <span style={{color:'#f97316',fontWeight:600}}>✅ {photo.name}</span>
                  : <span>📷 Click to upload a photo of the issue</span>}
              </label>
            </div>

            {/* Auto dept preview */}
            {dept && (
              <div className="dept-preview">
                <span className="dp-icon">{DEPT_ICON[dept]}</span>
                <div>
                  <div className="dp-label">Will be auto-assigned to</div>
                  <div className="dp-name">{dept}</div>
                </div>
                <div className="dp-phone">{DEPT_PHONE[dept]}</div>
              </div>
            )}

            {/* Buttons */}
            <div className="form-actions">
              <button type="button" className="btn btn-secondary"
                onClick={() => { setForm({...EMPTY, reporter:user?.name||''}); setPhoto(null); setErrors({}); setMarkerPos(null); setMapVisible(false); }}>
                Clear
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? '🤖 Submitting...' : 'Submit Report →'}
              </button>
            </div>

          </form>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="ri-sidebar">

          <div className="card" style={{borderLeft:'4px solid #6366f1'}}>
            <div className="card-title" style={{color:'#6366f1'}}>🤖 How Priority is Set</div>
            <div className="ri-info-text">
              <strong>BERT AI</strong> reads your title + description and computes a <strong>0–100 score</strong> based on semantic urgency.<br/><br/>
              Words like <em>flooding, accident, burst, dangerous, injury</em> → High score<br/><br/>
              Words like <em>minor, cosmetic, bench, paint</em> → Low score<br/><br/>
              <span style={{color:'#6366f1',fontWeight:600}}>No fixed ×40 or ×5 multipliers.</span>
            </div>
          </div>

          <div className="card" style={{borderLeft:`4px solid ${markerPos?'#10b981':'#e2e8f0'}`}}>
            <div className="card-title">📍 Location</div>
            {markerPos
              ? <div style={{textAlign:'center'}}><div style={{fontSize:22,marginBottom:4}}>✅</div><div style={{fontWeight:700,fontSize:12,color:'#059669'}}>Location Pinned</div><div style={{fontSize:11,color:'#64748b',marginTop:2}}>{form.location}</div></div>
              : <div style={{textAlign:'center',fontSize:12,color:'#f59e0b'}}>Click "Pick on Map" to set location</div>}
          </div>

          <div className="card">
            <div className="card-title">📱 SMS Confirmation</div>
            <div className="ri-info-text">
              After submitting, you will receive an SMS with:<br/><br/>
              • Your <strong>Reference Number</strong><br/>
              • Assigned department name<br/>
              • Department helpline number<br/>
              • Portal link to track status
            </div>
          </div>

          <div className="card">
            <div className="card-title">What Happens Next</div>
            <div className="ri-info-text" style={{lineHeight:2.2}}>
              1️⃣ Issue saved to dashboard<br/>
              2️⃣ Pin appears on City Map<br/>
              3️⃣ 🤖 BERT scores your text<br/>
              4️⃣ Auto-assigned to department<br/>
              5️⃣ 📱 SMS sent to your mobile<br/>
              6️⃣ Authority notified instantly
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
