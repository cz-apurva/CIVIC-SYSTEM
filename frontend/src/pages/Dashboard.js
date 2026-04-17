import React, { useRef, useEffect, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { useIssues } from '../IssueStore';
import './Dashboard.css';

Chart.register(...registerables);

const DM = {
  'Road Damage / Pothole':'Public Works','Broken Streetlight':'Electricity Board',
  'Garbage Overflow':'Sanitation Dept','Water Leakage':'Water Authority',
  'Damaged Public Property':'Municipal Corp','Drainage Problem':'Water Authority','Other':'Municipal Corp',
};
const IC = {
  'Road Damage / Pothole':'🛣️','Broken Streetlight':'💡','Garbage Overflow':'🗑️',
  'Water Leakage':'💧','Damaged Public Property':'🏚️','Drainage Problem':'🚰','Other':'⚠️',
};

// ── BERT score badge — always safe ──
const BertBadge = ({ score, label, confidence, method }) => {
  const s = Number(score);
  if (!label || label === 'Analysing...' || isNaN(s)) {
    return (
      <div style={{fontSize:11,color:'#94a3b8',fontStyle:'italic'}}>
        🤖 Analysing...
      </div>
    );
  }
  const cfg = {
    High:   { bg:'#fef2f2', color:'#dc2626', border:'#fecaca' },
    Medium: { bg:'#fffbeb', color:'#d97706', border:'#fde68a' },
    Low:    { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0' },
  }[label] || { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0' };

  const conf = isNaN(Number(confidence)) ? 0 : Math.round(Number(confidence) * 100);

  return (
    <div>
      <div style={{
        background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`,
        borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:700,
        display:'inline-flex', alignItems:'center', gap:4, marginBottom:3,
      }}>
        🤖 {label}
      </div>
      <div style={{fontSize:10,color:'#94a3b8'}}>
        Score: {Math.round(s)} · {conf}% conf
      </div>
      <div style={{fontSize:9,color:'#cbd5e1',marginTop:1}}>
        via {method === 'keyword-fallback' ? 'keyword model' : 'BERT NLP'}
      </div>
    </div>
  );
};

const StatusBadge = ({ s }) => {
  const styles = {
    Pending:     { bg:'#fffbeb', color:'#d97706', border:'#fde68a' },
    Accepted:    { bg:'#eff6ff', color:'#2563eb', border:'#bfdbfe' },
    Assigned:    { bg:'#f0f9ff', color:'#0284c7', border:'#bae6fd' },
    'In Progress':{ bg:'#faf5ff', color:'#7c3aed', border:'#ddd6fe' },
    Resolved:    { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0' },
    Rejected:    { bg:'#fef2f2', color:'#dc2626', border:'#fecaca' },
  };
  const c = styles[s] || styles.Pending;
  return (
    <span style={{
      background:c.bg, color:c.color, border:`1px solid ${c.border}`,
      borderRadius:6, padding:'3px 10px', fontSize:11, fontWeight:700,
    }}>{s}</span>
  );
};

export default function Dashboard({ user, onNavigate }) {
  const { issues, deleteIssue } = useIssues();   // ← no cycleStatus for citizens
  const [toast, setToast] = useState('');
  const r1=useRef(), r2=useRef(), r3=useRef(), r4=useRef(), ch=useRef({});

  const msg = m => { setToast(m); setTimeout(() => setToast(''), 2500); };
  const handleDel = id => {
    if (!window.confirm('Delete this issue?')) return;
    deleteIssue(id);
    msg('Issue deleted');
  };

  useEffect(() => { if (issues.length) build(); });

  function build() {
    const cat={}, st={Pending:0,Assigned:0,'In Progress':0,Resolved:0}, dp={};
    issues.forEach(i => {
      cat[i.category] = (cat[i.category]||0)+1;
      if (i.status in st) st[i.status]++;
      const d = DM[i.category]||'Municipal Corp'; dp[d]=(dp[d]||0)+1;
    });
    const base  = { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } };
    const axcfg = { x:{ ticks:{ color:'#94a3b8', font:{ size:10 } }, grid:{ color:'#f1f5f9' } }, y:{ ticks:{ color:'#94a3b8', font:{ size:10 } }, grid:{ color:'#f1f5f9' } } };
    const mk = (ref, key, type, data, ex) => {
      if (ch.current[key]) ch.current[key].destroy();
      if (!ref.current) return;
      ch.current[key] = new Chart(ref.current, { type, data, options:{ ...base, ...(ex||{}) } });
    };
    mk(r1,'c1','doughnut',{ labels:Object.keys(cat), datasets:[{ data:Object.values(cat), backgroundColor:['#ef4444','#f59e0b','#10b981','#6366f1','#1a3a5c','#ec4899'], borderWidth:2, borderColor:'#fff' }] },{ plugins:{ legend:{ display:true, position:'bottom', labels:{ color:'#64748b', font:{ size:10 }, boxWidth:10, padding:8 } } } });
    mk(r2,'c2','bar',     { labels:Object.keys(st), datasets:[{ data:Object.values(st), backgroundColor:['#f59e0b','#0284c7','#7c3aed','#10b981'], borderRadius:5, borderWidth:0 }] },{ scales:axcfg });
    mk(r3,'c3','line',    { labels:['Oct','Nov','Dec','Jan','Feb','Mar'], datasets:[{ data:[4,7,5,9,11,issues.length], borderColor:'#1a3a5c', backgroundColor:'rgba(26,58,92,.08)', tension:0.45, fill:true, pointRadius:4, pointBackgroundColor:'#1a3a5c', borderWidth:2 }] },{ scales:axcfg });
    mk(r4,'c4','bar',     { labels:Object.keys(dp), datasets:[{ data:Object.values(dp), backgroundColor:'#f97316', borderRadius:5, borderWidth:0 }] },{ indexAxis:'y', scales:{ x:{ ticks:{ color:'#94a3b8', font:{ size:10 } }, grid:{ color:'#f1f5f9' } }, y:{ ticks:{ color:'#94a3b8', font:{ size:10 } }, grid:{ display:false } } } });
  }

  const T = issues.length;
  const P = issues.filter(i => i.status==='Pending').length;
  const G = issues.filter(i => i.status==='In Progress').length;
  const R = issues.filter(i => i.status==='Resolved').length;

  const sorted = [...issues].sort((a,b) => {
    const as = Number(a.bert_score), bs = Number(b.bert_score);
    if (isNaN(as)) return 1; if (isNaN(bs)) return -1;
    return bs - as;
  });

  return (
    <div className="dash-page">
      <div className="dash-topbar">
        <div>
          <div className="dash-title">Dashboard</div>
          <div className="dash-sub">Welcome, {user?.name} — {T} issues · sorted by 🤖 BERT priority score</div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <button className="btn btn-primary" style={{background:'#f97316',border:'none'}}
            onClick={()=>onNavigate&&onNavigate('report')}>
            + Report New Issue
          </button>
          <span style={{fontSize:11,background:'rgba(99,102,241,.1)',color:'#6366f1',
            border:'1px solid rgba(99,102,241,.25)',borderRadius:6,padding:'4px 10px',fontWeight:700}}>
            🤖 BERT Active
          </span>
        </div>
      </div>

      <div className="dash-content">
        {/* STATS */}
        <div className="stats-row">
          <div className="stat-card" style={{'--sc':'#1a3a5c'}}><div className="stat-icon">📋</div><div className="stat-label">Total</div><div className="stat-value" style={{color:'#1a3a5c'}}>{T}</div><div className="stat-sub">All reports</div></div>
          <div className="stat-card" style={{'--sc':'#f59e0b'}}><div className="stat-icon">⏳</div><div className="stat-label">Pending</div><div className="stat-value" style={{color:'#d97706'}}>{P}</div><div className="stat-sub">Awaiting authority</div></div>
          <div className="stat-card" style={{'--sc':'#7c3aed'}}><div className="stat-icon">🔧</div><div className="stat-label">In Progress</div><div className="stat-value" style={{color:'#7c3aed'}}>{G}</div><div className="stat-sub">Active teams</div></div>
          <div className="stat-card" style={{'--sc':'#10b981'}}><div className="stat-icon">✅</div><div className="stat-label">Resolved</div><div className="stat-value" style={{color:'#059669'}}>{R}</div><div className="stat-sub">Completed</div></div>
        </div>

        {/* BERT info bar */}
        <div style={{margin:'0 20px 16px',background:'linear-gradient(135deg,#1a3a5c,#0f2035)',
          borderRadius:12,padding:'14px 20px',display:'flex',alignItems:'center',gap:16,
          border:'1px solid rgba(99,102,241,.3)'}}>
          <div style={{fontSize:30}}>🤖</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13,color:'#fff',marginBottom:3}}>BERT Priority Scoring</div>
            <div style={{fontSize:11,color:'#94a3b8'}}>
              Each complaint is scored 0–100 by <strong style={{color:'#6366f1'}}>bert-base-uncased</strong> based on semantic urgency of the text. 
              No manual weights. High-danger language auto-scores higher. Status can only be changed by Government Authority.
            </div>
          </div>
          <div style={{textAlign:'center',flexShrink:0}}>
            <div style={{fontSize:20,fontWeight:800,color:'#6366f1'}}>0–100</div>
            <div style={{fontSize:9,color:'#94a3b8'}}>BERT Score Range</div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="charts-row">
          <div className="chart-card"><div className="ctitle">Issues by Category</div><div className="chart-wrap"><canvas ref={r1}/></div></div>
          <div className="chart-card"><div className="ctitle">Status Breakdown</div><div className="chart-wrap"><canvas ref={r2}/></div></div>
        </div>
        <div className="charts-row">
          <div className="chart-card"><div className="ctitle">Monthly Trend</div><div className="chart-wrap"><canvas ref={r3}/></div></div>
          <div className="chart-card"><div className="ctitle">Department Workload</div><div className="chart-wrap"><canvas ref={r4}/></div></div>
        </div>

        {/* TABLE */}
        <div className="table-card">
          <div className="table-card-head">
            <b>All Reported Issues</b>
            <span style={{fontSize:11,color:'#94a3b8'}}>{T} issues · 🤖 BERT sorted · Status updated by Authority only</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Issue</th><th>Category</th><th>Location</th>
                <th>🤖 BERT Priority</th><th>Status</th><th>Department</th><th>Action</th>
              </tr></thead>
              <tbody>
                {sorted.map(i => (
                  <tr key={i._id}>
                    <td>
                      <div style={{fontWeight:700,fontSize:13}}>{IC[i.category]||'⚠️'} {i.title}</div>
                      <div style={{color:'#94a3b8',fontSize:10,marginTop:2}}>{i.createdAt?.split('T')[0]}</div>
                      {i.refNo && <div style={{fontSize:9,color:'#cbd5e1',marginTop:1,fontFamily:'monospace'}}>{i.refNo}</div>}
                    </td>
                    <td style={{color:'#64748b',fontSize:12}}>{i.category}</td>
                    <td style={{color:'#64748b',fontSize:12}}>📍 {i.location}</td>
                    <td>
                      <BertBadge
                        score={i.bert_score}
                        label={i.bert_label}
                        confidence={i.bert_confidence}
                        method={i.bert_method}
                      />
                    </td>
                    <td><StatusBadge s={i.status}/></td>
                    <td style={{fontSize:11,color:'#64748b'}}>{DM[i.category]||'Municipal'}</td>
                    <td>
                      {/* Citizens can only delete — no status change */}
                      <div style={{display:'flex',gap:5,flexDirection:'column'}}>
                        <div style={{fontSize:10,color:'#94a3b8',fontStyle:'italic'}}>
                          Status updated by Authority
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={()=>handleDel(i._id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
