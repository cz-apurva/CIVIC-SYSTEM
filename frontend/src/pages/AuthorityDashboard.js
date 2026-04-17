import React, { useState } from 'react';
import { useIssues } from '../IssueStore';
import './AuthorityDashboard.css';

const DM = {
  'Road Damage / Pothole':'Public Works','Broken Streetlight':'Electricity Board',
  'Garbage Overflow':'Sanitation Dept','Water Leakage':'Water Authority',
  'Damaged Public Property':'Municipal Corp','Drainage Problem':'Water Authority','Other':'Municipal Corp',
};
const IC = {
  'Road Damage / Pothole':'🛣️','Broken Streetlight':'💡','Garbage Overflow':'🗑️',
  'Water Leakage':'💧','Damaged Public Property':'🏚️','Drainage Problem':'🚰','Other':'⚠️',
};

const STATUS_FLOW  = ['Pending','Accepted','Assigned','In Progress','Resolved','Rejected'];
const STATUS_COLOR = {
  Pending:'#d97706', Accepted:'#2563eb', Assigned:'#0284c7',
  'In Progress':'#7c3aed', Resolved:'#16a34a', Rejected:'#dc2626',
};

// ── BERT score badge for authority ──
const BertScore = ({ score, label, confidence, method }) => {
  const s = Number(score);
  if (isNaN(s)) return <span style={{fontSize:11,color:'#94a3b8'}}>Analysing...</span>;
  const cfg = {
    High:   { bg:'#fef2f2', color:'#dc2626', border:'#fecaca' },
    Medium: { bg:'#fffbeb', color:'#d97706', border:'#fde68a' },
    Low:    { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0' },
  }[label] || { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0' };
  const conf = isNaN(Number(confidence)) ? 0 : Math.round(Number(confidence)*100);
  return (
    <div>
      <span style={{
        background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`,
        borderRadius:6, padding:'3px 9px', fontSize:11, fontWeight:700, display:'inline-block',
      }}>
        {label}
      </span>
      <div style={{fontSize:10,color:'#94a3b8',marginTop:2}}>{Math.round(s)} · {conf}%</div>
      <div style={{fontSize:9,color:'#cbd5e1'}}>
        🤖 {method==='keyword-fallback'?'keyword':'bert-base-uncased'}
      </div>
    </div>
  );
};

export default function AuthorityDashboard({ authority, onLogout }) {
  const { issues, updateStatus } = useIssues();
  const [filter,    setFilter]    = useState('All');
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState(null);
  const [updateForm,setUF]        = useState({ status:'', notes:'', assignedTo:'' });
  const [toast,     setToast]     = useState('');
  const [activeTab, setActiveTab] = useState('complaints');
  const [selected,  setSelected]  = useState(null);

  const msg = m => { setToast(m); setTimeout(()=>setToast(''),3500); };

  const openUpdate = issue => {
    setModal(issue);
    setUF({ status:issue.status, notes:issue.notes||'', assignedTo:issue.assignedTo||'' });
  };

  const submitUpdate = () => {
    if (!updateForm.status) { msg('Select a status'); return; }
    updateStatus(modal._id, updateForm.status, updateForm.notes, updateForm.assignedTo);
    msg(`✅ "${modal.title}" updated to "${updateForm.status}"`);
    setModal(null);
    setSelected(null);
  };

  const deptFiltered = issues.filter(i => {
    if (authority.access === 'full') return true;
    const k = { roads:'Public Works', garbage:'Sanitation Dept', water:'Water Authority', lights:'Electricity Board' };
    return DM[i.category] === k[authority.access];
  });

  const visible = deptFiltered.filter(i => {
    const ms = filter==='All' || i.status===filter;
    const mq = !search || i.title.toLowerCase().includes(search.toLowerCase()) ||
               i.location.toLowerCase().includes(search.toLowerCase()) ||
               (i.reporter||'').toLowerCase().includes(search.toLowerCase());
    return ms && mq;
  }).sort((a,b) => (Number(b.bert_score)||0) - (Number(a.bert_score)||0));

  const counts = ['All',...STATUS_FLOW].reduce((acc,s) => ({
    ...acc,
    [s]: s==='All' ? deptFiltered.length : deptFiltered.filter(i=>i.status===s).length
  }), {});

  return (
    <div className="auth-dash">
      <div className="auth-topbar">
        <div className="at-left">
          <div className="at-logo">🏛️ SCIS</div>
          <div className="at-sep">|</div>
          <div>
            <div className="at-title">Authority Dashboard</div>
            <div className="at-sub">{authority.name} · {authority.dept}</div>
          </div>
        </div>
        <div className="at-right">
          {/* BERT indicator */}
          <span style={{fontSize:10,background:'rgba(99,102,241,.12)',color:'#6366f1',
            border:'1px solid rgba(99,102,241,.25)',borderRadius:6,padding:'4px 10px',fontWeight:700}}>
            🤖 BERT Scoring
          </span>
          <div className="at-badge">{authority.role}</div>
          <div className="at-id">ID: {authority.id}</div>
          <button className="at-logout" onClick={onLogout}>Sign Out</button>
        </div>
      </div>

      <div className="auth-tabs">
        <button className={`atab ${activeTab==='complaints'?'active':''}`} onClick={()=>setActiveTab('complaints')}>📋 Citizen Complaints</button>
        <button className={`atab ${activeTab==='stats'?'active':''}`} onClick={()=>setActiveTab('stats')}>📊 Statistics</button>
        <button className={`atab ${activeTab==='dept'?'active':''}`} onClick={()=>setActiveTab('dept')}>🏛️ Department View</button>
      </div>

      <div className="auth-body">
        {/* Filter row */}
        <div className="filter-row">
          <div className="filter-pills">
            {['All',...STATUS_FLOW].map(s => (
              <button key={s} className={`fpill ${filter===s?'active':''}`}
                style={filter===s && s!=='All' ? {background:STATUS_COLOR[s],color:'#fff',borderColor:STATUS_COLOR[s]} : {}}
                onClick={()=>setFilter(s)}>
                {s} <span className="fpill-count">{counts[s]||0}</span>
              </button>
            ))}
          </div>
          <input className="search-box" placeholder="Search by title, location, citizen..."
            value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>

        {activeTab==='complaints' && (
          <div className="complaints-section">
            <div className="comp-header">
              <b>Citizen Complaints</b>
              <span style={{fontSize:11,color:'#94a3b8'}}>
                {visible.length} results · sorted by 🤖 BERT priority score
              </span>
            </div>
            <div className="comp-table-wrap">
              <table>
                <thead><tr>
                  <th>Complaint</th><th>Citizen</th><th>Category</th>
                  <th>Location</th><th>🤖 BERT Priority</th><th>Status</th><th>Date</th><th>Action</th>
                </tr></thead>
                <tbody>
                  {visible.map(i => (
                    <tr key={i._id} className={i.status==='Pending'?'row-pending':''}>
                      <td>
                        <div style={{fontWeight:700,fontSize:13}}>{IC[i.category]||'⚠️'} {i.title}</div>
                        {i.refNo && <div style={{fontSize:9,color:'#94a3b8',fontFamily:'monospace',marginTop:2}}>{i.refNo}</div>}
                        {i.notes && <div className="comp-notes">💬 {i.notes}</div>}
                      </td>
                      <td>
                        <div style={{fontWeight:600,fontSize:12}}>{i.reporter||'Anonymous'}</div>
                        {i.phone && <div style={{fontSize:10,color:'#64748b'}}>📱 +91-{i.phone}</div>}
                      </td>
                      <td>
                        <div style={{fontSize:12}}>{i.category}</div>
                        <div className="dept-chip">{DM[i.category]||'Municipal'}</div>
                      </td>
                      <td style={{fontSize:12,color:'#64748b'}}>📍 {i.location}</td>
                      <td>
                        {/* BERT score shown clearly to authority */}
                        <BertScore
                          score={i.bert_score}
                          label={i.bert_label}
                          confidence={i.bert_confidence}
                          method={i.bert_method}
                        />
                      </td>
                      <td>
                        <span className="status-pill"
                          style={{background:(STATUS_COLOR[i.status]||'#64748b')+'22',
                            color:STATUS_COLOR[i.status]||'#64748b',
                            border:`1px solid ${(STATUS_COLOR[i.status]||'#64748b')}44`}}>
                          {i.status}
                        </span>
                        {i.assignedTo && <div style={{fontSize:10,color:'#64748b',marginTop:2}}>→ {i.assignedTo}</div>}
                      </td>
                      <td style={{fontSize:11,color:'#94a3b8'}}>{i.createdAt?.split('T')[0]}</td>
                      <td>
                        <button className="act-btn" onClick={()=>openUpdate(i)}>✏️ Update</button>
                        <button className="act-btn view-btn" style={{marginTop:4}}
                          onClick={()=>setSelected(selected?._id===i._id?null:i)}>
                          👁 View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {visible.length===0 && (
                    <tr><td colSpan="8" style={{textAlign:'center',padding:32,color:'#94a3b8'}}>No complaints found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="detail-card">
                <div className="dc-head">
                  <b>Complaint Detail — {selected.refNo || selected._id}</b>
                  <button onClick={()=>setSelected(null)}>✕</button>
                </div>
                <div className="dc-grid">
                  <div><div className="dc-label">Title</div><div className="dc-val">{selected.title}</div></div>
                  <div><div className="dc-label">Citizen</div><div className="dc-val">{selected.reporter||'—'}</div></div>
                  <div><div className="dc-label">Mobile</div><div className="dc-val">{selected.phone?`+91-${selected.phone}`:'Not provided'}</div></div>
                  <div><div className="dc-label">Category</div><div className="dc-val">{selected.category}</div></div>
                  <div><div className="dc-label">Location</div><div className="dc-val">{selected.location}</div></div>
                  <div>
                    <div className="dc-label">🤖 BERT Score</div>
                    <div className="dc-val">
                      <strong style={{color:STATUS_COLOR[selected.bert_label]||'#64748b'}}>
                        {Math.round(Number(selected.bert_score)||0)} — {selected.bert_label}
                      </strong>
                      <div style={{fontSize:10,color:'#94a3b8'}}>
                        Confidence: {Math.round((Number(selected.bert_confidence)||0)*100)}% · 
                        Model: {selected.bert_method==='keyword-fallback'?'keyword model':'bert-base-uncased'}
                      </div>
                    </div>
                  </div>
                  <div><div className="dc-label">Status</div><div className="dc-val" style={{color:STATUS_COLOR[selected.status],fontWeight:700}}>{selected.status}</div></div>
                  <div><div className="dc-label">Assigned To</div><div className="dc-val">{selected.assignedTo||'Not assigned'}</div></div>
                  <div className="dc-full"><div className="dc-label">Notes</div><div className="dc-val dc-notes">{selected.notes||'No notes yet'}</div></div>
                  <div className="dc-full"><div className="dc-label">Description</div><div className="dc-val">{selected.description||'—'}</div></div>
                </div>
                <button className="act-btn" style={{marginTop:12}} onClick={()=>openUpdate(selected)}>✏️ Update Status</button>
              </div>
            )}
          </div>
        )}

        {activeTab==='stats' && (
          <div className="stats-tab">
            <div className="stats-cards">
              {[
                {label:'Total',lbl:'All Issues',val:deptFiltered.length,icon:'📋',color:'#1a3a5c'},
                {label:'Pending',lbl:'Awaiting Action',val:counts.Pending||0,icon:'⏳',color:'#d97706'},
                {label:'Accepted',lbl:'Acknowledged',val:counts.Accepted||0,icon:'✅',color:'#2563eb'},
                {label:'In Progress',lbl:'Active Work',val:counts['In Progress']||0,icon:'🔧',color:'#7c3aed'},
                {label:'Resolved',lbl:'Completed',val:counts.Resolved||0,icon:'🎯',color:'#16a34a'},
                {label:'Rejected',lbl:'Not Actionable',val:counts.Rejected||0,icon:'❌',color:'#dc2626'},
              ].map((s,i) => (
                <div key={i} className="st-card" style={{'--sc':s.color}}>
                  <div className="st-icon">{s.icon}</div>
                  <div className="st-val" style={{color:s.color}}>{s.val}</div>
                  <div className="st-lbl">{s.label}</div>
                  <div style={{fontSize:9,color:'#94a3b8'}}>{s.lbl}</div>
                </div>
              ))}
            </div>
            {/* BERT distribution */}
            <div style={{margin:'20px 0',background:'#f8fafc',borderRadius:12,padding:'16px 20px',border:'1px solid #e2e8f0'}}>
              <div style={{fontWeight:700,fontSize:13,color:'#1a3a5c',marginBottom:12}}>🤖 BERT Priority Distribution</div>
              <div style={{display:'flex',gap:12}}>
                {[['High','#dc2626'],['Medium','#d97706'],['Low','#16a34a']].map(([lbl,clr])=>{
                  const cnt = deptFiltered.filter(i=>i.bert_label===lbl).length;
                  const pct = deptFiltered.length ? Math.round(cnt/deptFiltered.length*100) : 0;
                  return (
                    <div key={lbl} style={{flex:1,background:'#fff',borderRadius:8,padding:'12px',border:`1px solid ${clr}33`}}>
                      <div style={{fontWeight:700,fontSize:18,color:clr}}>{cnt}</div>
                      <div style={{fontSize:11,fontWeight:600,color:clr}}>{lbl} Priority</div>
                      <div style={{fontSize:10,color:'#94a3b8'}}>{pct}% of total</div>
                      <div style={{height:4,background:'#f1f5f9',borderRadius:2,marginTop:6}}>
                        <div style={{height:'100%',width:`${pct}%`,background:clr,borderRadius:2,transition:'width .3s'}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab==='dept' && (
          <div className="dept-tab">
            {['Public Works','Electricity Board','Sanitation Dept','Water Authority','Municipal Corp'].map(dept => {
              const dIssues = deptFiltered.filter(i=>DM[i.category]===dept);
              if (!dIssues.length) return null;
              const pending  = dIssues.filter(i=>i.status==='Pending').length;
              const resolved = dIssues.filter(i=>i.status==='Resolved').length;
              const avgBert  = Math.round(dIssues.reduce((s,i)=>s+(Number(i.bert_score)||0),0)/dIssues.length);
              return (
                <div key={dept} className="dept-block">
                  <div className="dept-block-head">
                    <div>
                      <div className="dept-block-name">{dept}</div>
                      <div className="dept-block-sub">
                        {dIssues.length} total · {pending} pending · {resolved} resolved
                        · 🤖 avg BERT: {avgBert}
                      </div>
                    </div>
                    <div className="dept-block-pct">{Math.round((resolved/dIssues.length)*100)}%</div>
                  </div>
                  <div className="dept-issue-list">
                    {dIssues.slice(0,5).map(i => (
                      <div key={i._id} className="dil-row">
                        <span>{IC[i.category]||'⚠️'} {i.title}</span>
                        <span style={{fontSize:10,color:'#6366f1',fontWeight:700}}>
                          🤖 {Math.round(Number(i.bert_score)||0)}
                        </span>
                        <span className="status-pill"
                          style={{background:(STATUS_COLOR[i.status]||'#64748b')+'22',
                            color:STATUS_COLOR[i.status]||'#64748b',
                            border:`1px solid ${(STATUS_COLOR[i.status]||'#64748b')}44`}}>
                          {i.status}
                        </span>
                        <button className="act-btn" onClick={()=>openUpdate(i)}>Update</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UPDATE MODAL — only authority can update status */}
      {modal && (
        <div className="modal-overlay" onClick={e=>{if(e.target.classList.contains('modal-overlay'))setModal(null)}}>
          <div className="modal-box">
            <div className="modal-head">
              <div>
                <div className="modal-title">Update Complaint Status</div>
                <div className="modal-sub">{modal.title}</div>
              </div>
              <button className="modal-close" onClick={()=>setModal(null)}>✕</button>
            </div>

            {/* BERT score info in modal */}
            <div style={{margin:'0 20px 14px',background:'rgba(99,102,241,.06)',
              border:'1px solid rgba(99,102,241,.2)',borderRadius:8,padding:'10px 14px'}}>
              <div style={{fontSize:11,fontWeight:700,color:'#6366f1',marginBottom:3}}>
                🤖 BERT Priority Score
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{fontSize:22,fontWeight:800,color:
                  modal.bert_label==='High'?'#dc2626':modal.bert_label==='Medium'?'#d97706':'#16a34a'}}>
                  {Math.round(Number(modal.bert_score)||0)}
                </div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:'#1a3a5c'}}>{modal.bert_label} Priority</div>
                  <div style={{fontSize:10,color:'#94a3b8'}}>
                    Confidence: {Math.round((Number(modal.bert_confidence)||0)*100)}% · 
                    {modal.bert_method==='keyword-fallback'?' keyword model':' bert-base-uncased'}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-citizen-info">
              <div className="mci-item"><span>👤 Citizen</span><strong>{modal.reporter||'Anonymous'}</strong></div>
              {modal.phone && <div className="mci-item"><span>📱 Mobile</span><strong>+91-{modal.phone}</strong></div>}
              <div className="mci-item"><span>📍 Location</span><strong>{modal.location}</strong></div>
              <div className="mci-item"><span>📅 Reported</span><strong>{modal.createdAt?.split('T')[0]}</strong></div>
              <div className="mci-item"><span>🏛️ Dept</span><strong>{DM[modal.category]||'Municipal'}</strong></div>
            </div>

            <div className="modal-field">
              <label>Update Status — Citizen will be notified</label>
              <div className="status-btn-grid">
                {STATUS_FLOW.map(s => (
                  <button key={s} className={`sbtn ${updateForm.status===s?'selected':''}`}
                    style={updateForm.status===s?{background:STATUS_COLOR[s],color:'#fff',borderColor:STATUS_COLOR[s]}:{}}
                    onClick={()=>setUF(f=>({...f,status:s}))}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {(updateForm.status==='Assigned'||updateForm.status==='In Progress') && (
              <div className="modal-field">
                <label>Assign To (Team / Officer Name)</label>
                <input placeholder="e.g. PWD Team B" value={updateForm.assignedTo}
                  onChange={e=>setUF(f=>({...f,assignedTo:e.target.value}))}/>
              </div>
            )}

            <div className="modal-field">
              <label>Official Note to Citizen</label>
              <textarea rows={3}
                placeholder="e.g. Your complaint has been accepted. Repair work will begin within 48 hours."
                value={updateForm.notes}
                onChange={e=>setUF(f=>({...f,notes:e.target.value}))}/>
            </div>

            <div className="modal-actions">
              <button className="modal-cancel" onClick={()=>setModal(null)}>Cancel</button>
              <button className="modal-submit" onClick={submitUpdate}>✅ Update & Notify Citizen</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="auth-toast">{toast}</div>}
    </div>
  );
}
