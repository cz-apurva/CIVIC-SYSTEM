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

// ── BERT badge ──
const BertBadge = ({ score, label, confidence, method }) => {
  const s = Number(score);
  if (isNaN(s) || !label || label === 'Analysing...') {
    return <div style={{fontSize:11,color:'#94a3b8',fontStyle:'italic'}}>🤖 Scoring...</div>;
  }
  const cfg = {
    High:  {bg:'#fef2f2',color:'#dc2626',border:'#fecaca'},
    Medium:{bg:'#fffbeb',color:'#d97706',border:'#fde68a'},
    Low:   {bg:'#f0fdf4',color:'#16a34a',border:'#bbf7d0'},
  }[label] || {bg:'#f8fafc',color:'#64748b',border:'#e2e8f0'};
  const conf = isNaN(Number(confidence)) ? 0 : Math.round(Number(confidence)*100);
  return (
    <div>
      <div style={{background:cfg.bg,color:cfg.color,border:`1px solid ${cfg.border}`,borderRadius:6,padding:'3px 10px',fontSize:11,fontWeight:700,display:'inline-flex',alignItems:'center',gap:4,marginBottom:3}}>
        🤖 {label}
      </div>
      <div style={{fontSize:10,color:'#94a3b8'}}>Score: {Math.round(s)} · {conf}% conf</div>
      <div style={{fontSize:9,color:'#cbd5e1',marginTop:1}}>{method==='keyword-fallback'?'keyword model':'bert-base-uncased'}</div>
    </div>
  );
};

const StatusBadge = ({ s }) => {
  const m = {
    Pending:{bg:'#fffbeb',color:'#d97706',border:'#fde68a'},
    Accepted:{bg:'#eff6ff',color:'#2563eb',border:'#bfdbfe'},
    Assigned:{bg:'#f0f9ff',color:'#0284c7',border:'#bae6fd'},
    'In Progress':{bg:'#faf5ff',color:'#7c3aed',border:'#ddd6fe'},
    Resolved:{bg:'#f0fdf4',color:'#16a34a',border:'#bbf7d0'},
    Rejected:{bg:'#fef2f2',color:'#dc2626',border:'#fecaca'},
  };
  const c = m[s]||m.Pending;
  return <span style={{background:c.bg,color:c.color,border:`1px solid ${c.border}`,borderRadius:6,padding:'3px 10px',fontSize:11,fontWeight:700}}>{s}</span>;
};

export default function Dashboard({ user, onNavigate }) {
  const { issues, deleteIssue } = useIssues();
  const [toast,    setToast]    = useState('');
  const [tab,      setTab]      = useState('all');   // 'mine' | 'all'
  const r1=useRef(),r2=useRef(),r3=useRef(),r4=useRef(),ch=useRef({});

  const msg = m => { setToast(m); setTimeout(()=>setToast(''),2500); };

  // ── Ownership check — citizen can ONLY delete issues they reported ──
  const isOwner = issue => {
    if (!user) return false;
    // Match by reporter name OR reporter email
    return (
      (issue.reporter && user.name && issue.reporter.toLowerCase() === user.name.toLowerCase()) ||
      (issue.reporterEmail && user.email && issue.reporterEmail.toLowerCase() === user.email.toLowerCase()) ||
      (issue.email && user.email && issue.email.toLowerCase() === user.email.toLowerCase())
    );
  };

  const handleDel = (id, issue) => {
    if (!isOwner(issue)) {
      msg('You can only delete issues you reported yourself.');
      return;
    }
    if (!window.confirm('Delete your issue "' + issue.title + '"?')) return;
    deleteIssue(id);
    msg('Your issue has been deleted.');
  };

  useEffect(() => { if (issues.length) build(); });

  function build() {
    const cat={},st={Pending:0,Assigned:0,'In Progress':0,Resolved:0},dp={};
    issues.forEach(i=>{
      cat[i.category]=(cat[i.category]||0)+1;
      if(i.status in st)st[i.status]++;
      const d=DM[i.category]||'Municipal Corp'; dp[d]=(dp[d]||0)+1;
    });
    const base={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}}};
    const ax={x:{ticks:{color:'#94a3b8',font:{size:10}},grid:{color:'#f1f5f9'}},y:{ticks:{color:'#94a3b8',font:{size:10}},grid:{color:'#f1f5f9'}}};
    const mk=(ref,key,type,data,ex)=>{
      if(ch.current[key])ch.current[key].destroy();
      if(!ref.current)return;
      ch.current[key]=new Chart(ref.current,{type,data,options:{...base,...(ex||{})}});
    };
    mk(r1,'c1','doughnut',{labels:Object.keys(cat),datasets:[{data:Object.values(cat),backgroundColor:['#ef4444','#f59e0b','#10b981','#6366f1','#1a3a5c','#ec4899'],borderWidth:2,borderColor:'#fff'}]},{plugins:{legend:{display:true,position:'bottom',labels:{color:'#64748b',font:{size:10},boxWidth:10,padding:8}}}});
    mk(r2,'c2','bar',{labels:Object.keys(st),datasets:[{data:Object.values(st),backgroundColor:['#f59e0b','#0284c7','#7c3aed','#10b981'],borderRadius:5,borderWidth:0}]},{scales:ax});
    mk(r3,'c3','line',{labels:['Oct','Nov','Dec','Jan','Feb','Mar'],datasets:[{data:[4,7,5,9,11,issues.length],borderColor:'#1a3a5c',backgroundColor:'rgba(26,58,92,.08)',tension:0.45,fill:true,pointRadius:4,pointBackgroundColor:'#1a3a5c',borderWidth:2}]},{scales:ax});
    mk(r4,'c4','bar',{labels:Object.keys(dp),datasets:[{data:Object.values(dp),backgroundColor:'#f97316',borderRadius:5,borderWidth:0}]},{indexAxis:'y',scales:{x:{ticks:{color:'#94a3b8',font:{size:10}},grid:{color:'#f1f5f9'}},y:{ticks:{color:'#94a3b8',font:{size:10}},grid:{display:false}}}});
  }

  const T  = issues.length;
  const P  = issues.filter(i=>i.status==='Pending').length;
  const G  = issues.filter(i=>i.status==='In Progress').length;
  const R  = issues.filter(i=>i.status==='Resolved').length;

  // My issues = issues reported by this citizen
  const myIssues  = issues.filter(i => isOwner(i));
  const allSorted = [...issues].sort((a,b)=>(Number(b.bert_score)||0)-(Number(a.bert_score)||0));
  const displayed = tab === 'mine' ? myIssues : allSorted;

  return (
    <div className="dash-page">
      <div className="dash-topbar">
        <div>
          <div className="dash-title">Dashboard</div>
          <div className="dash-sub">Welcome, {user?.name} — {T} total issues · 🤖 BERT priority sorted</div>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <button className="btn btn-primary" style={{background:'#f97316',border:'none'}}
            onClick={()=>onNavigate&&onNavigate('report')}>
            + Report Issue
          </button>
          <span style={{fontSize:11,background:'rgba(99,102,241,.1)',color:'#6366f1',border:'1px solid rgba(99,102,241,.25)',borderRadius:6,padding:'4px 10px',fontWeight:700}}>
            🤖 BERT Active
          </span>
        </div>
      </div>

      <div className="dash-content">
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card" style={{'--sc':'#1a3a5c'}}><div className="stat-icon">📋</div><div className="stat-label">Total</div><div className="stat-value" style={{color:'#1a3a5c'}}>{T}</div><div className="stat-sub">All issues</div></div>
          <div className="stat-card" style={{'--sc':'#f59e0b'}}><div className="stat-icon">⏳</div><div className="stat-label">Pending</div><div className="stat-value" style={{color:'#d97706'}}>{P}</div><div className="stat-sub">Awaiting authority</div></div>
          <div className="stat-card" style={{'--sc':'#7c3aed'}}><div className="stat-icon">🔧</div><div className="stat-label">In Progress</div><div className="stat-value" style={{color:'#7c3aed'}}>{G}</div><div className="stat-sub">Active</div></div>
          <div className="stat-card" style={{'--sc':'#10b981'}}><div className="stat-icon">✅</div><div className="stat-label">Resolved</div><div className="stat-value" style={{color:'#059669'}}>{R}</div><div className="stat-sub">Done</div></div>
        </div>

        {/* Charts */}
        <div className="charts-row">
          <div className="chart-card"><div className="ctitle">By Category</div><div className="chart-wrap"><canvas ref={r1}/></div></div>
          <div className="chart-card"><div className="ctitle">Status Breakdown</div><div className="chart-wrap"><canvas ref={r2}/></div></div>
        </div>
        <div className="charts-row">
          <div className="chart-card"><div className="ctitle">Monthly Trend</div><div className="chart-wrap"><canvas ref={r3}/></div></div>
          <div className="chart-card"><div className="ctitle">Dept Workload</div><div className="chart-wrap"><canvas ref={r4}/></div></div>
        </div>

        {/* Issues table with tabs */}
        <div className="table-card">
          <div className="table-card-head">
            {/* Tab switcher */}
            <div style={{display:'flex',gap:0,borderRadius:8,overflow:'hidden',border:'1px solid #e2e8f0'}}>
              <button onClick={()=>setTab('all')} style={{
                padding:'7px 18px',border:'none',fontSize:12,fontWeight:700,cursor:'pointer',
                background:tab==='all'?'#1a3a5c':'#fff',
                color:tab==='all'?'#fff':'#64748b', transition:'all .18s',
              }}>
                🌍 All Issues ({T})
              </button>
              <button onClick={()=>setTab('mine')} style={{
                padding:'7px 18px',border:'none',borderLeft:'1px solid #e2e8f0',fontSize:12,fontWeight:700,cursor:'pointer',
                background:tab==='mine'?'#f97316':'#fff',
                color:tab==='mine'?'#fff':'#64748b', transition:'all .18s',
              }}>
                👤 My Issues ({myIssues.length})
              </button>
            </div>
            <span style={{fontSize:11,color:'#94a3b8'}}>
              {tab==='mine'
                ? `Showing your ${myIssues.length} reported issue(s) — you can delete these`
                : `All ${T} issues — you can only delete issues YOU reported`}
            </span>
          </div>

          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Issue</th><th>Category</th><th>Location</th>
                <th>🤖 BERT Priority</th><th>Status</th><th>Department</th><th>Action</th>
              </tr></thead>
              <tbody>
                {displayed.map(i => {
                  const own = isOwner(i);
                  return (
                    <tr key={i._id} style={own?{background:'rgba(249,115,22,.03)'}:{}}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <div style={{fontWeight:700,fontSize:13}}>{IC[i.category]||'⚠️'} {i.title}</div>
                          {own && <span style={{fontSize:9,background:'#fff7ed',color:'#f97316',border:'1px solid #fed7aa',borderRadius:4,padding:'1px 6px',fontWeight:700,flexShrink:0}}>Mine</span>}
                        </div>
                        <div style={{color:'#94a3b8',fontSize:10,marginTop:2}}>{i.createdAt?.split('T')[0]}</div>
                        {i.refNo && <div style={{fontSize:9,color:'#cbd5e1',fontFamily:'monospace'}}>{i.refNo}</div>}
                      </td>
                      <td style={{color:'#64748b',fontSize:12}}>{i.category}</td>
                      <td style={{color:'#64748b',fontSize:12}}>📍 {i.location}</td>
                      <td>
                        <BertBadge score={i.bert_score} label={i.bert_label} confidence={i.bert_confidence} method={i.bert_method}/>
                      </td>
                      <td><StatusBadge s={i.status}/></td>
                      <td style={{fontSize:11,color:'#64748b'}}>{DM[i.category]||'Municipal'}</td>
                      <td>
                        <div style={{display:'flex',flexDirection:'column',gap:4}}>
                          {/* Only show delete for own issues */}
                          {own ? (
                            <button className="btn btn-danger btn-sm"
                              onClick={()=>handleDel(i._id, i)}
                              style={{fontSize:11}}>
                              🗑️ Delete
                            </button>
                          ) : (
                            <span style={{fontSize:10,color:'#cbd5e1',fontStyle:'italic',whiteSpace:'nowrap'}}>
                              Not your issue
                            </span>
                          )}
                          <span style={{fontSize:9,color:'#cbd5e1',fontStyle:'italic'}}>
                            Status by Authority
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {displayed.length === 0 && (
                  <tr><td colSpan="7" style={{textAlign:'center',padding:40,color:'#94a3b8'}}>
                    {tab==='mine'
                      ? 'You have not reported any issues yet. Click "+ Report Issue" to start.'
                      : 'No issues found.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
