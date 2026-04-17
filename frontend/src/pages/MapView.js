import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useIssues } from '../IssueStore';   // ← shared store — map always in sync
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CC = [28.6692, 77.4538];

// Status colors — same as dashboard badges
const SC = {
  Pending:'#f59e0b', Assigned:'#1a3a5c', 'In Progress':'#6366f1', Resolved:'#10b981', Accepted:'#3b82f6', Rejected:'#ef4444',
};
const IC = {
  'Road Damage / Pothole':'🛣️','Broken Streetlight':'💡','Garbage Overflow':'🗑️',
  'Water Leakage':'💧','Damaged Public Property':'🏚️','Drainage Problem':'🚰','Other':'⚠️',
};
const CATS = ['All','Road Damage / Pothole','Broken Streetlight','Garbage Overflow','Water Leakage','Drainage Problem','Damaged Public Property'];

const mkIcon = issue => L.divIcon({
  className:'',
  html: `<div style="width:32px;height:32px;background:${SC[issue.status]||'#f59e0b'};border:3px solid rgba(255,255,255,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 3px 12px rgba(0,0,0,.35)">${IC[issue.category]||'⚠️'}</div>`,
  iconSize:[32,32], iconAnchor:[16,16],
});

export default function MapView() {
  const { issues } = useIssues();   // ← always up to date with latest status
  const [filter, setFilter] = useState('All');

  // Only show issues that have coordinates
  const withCoords = issues.filter(i => i.lat && i.lng);
  const visible = filter === 'All' ? withCoords : withCoords.filter(i => i.category === filter);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">City Issue Map</div>
          <div className="page-sub">Pins update in real time as statuses change — {visible.length} issues shown</div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14,padding:'0 20px'}}>
        {CATS.map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding:'5px 14px', borderRadius:'999px', fontSize:12, fontWeight:600,
            cursor:'pointer', border:'1px solid',
            borderColor: filter===c ? '#f97316' : '#e2e8f0',
            background:   filter===c ? '#f97316' : '#fff',
            color:        filter===c ? '#fff'     : '#64748b',
            transition:'all .18s'
          }}>
            {IC[c]||'🗺️'} {c}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:12,padding:'0 20px',fontSize:11,color:'#64748b'}}>
        {Object.entries(SC).map(([s,c]) => (
          <div key={s} style={{display:'flex',alignItems:'center',gap:5}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:c,flexShrink:0}}/>
            {s}
          </div>
        ))}
      </div>

      <div style={{padding:'0 20px 20px'}}>
        <div className="card" style={{padding:8}}>
          <MapContainer center={CC} zoom={12} style={{height:500,borderRadius:8}} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" subdomains="abcd"/>
            {visible.map(issue => (
              <Marker key={issue._id + '_' + issue.status} position={[issue.lat, issue.lng]} icon={mkIcon(issue)}>
                <Popup>
                  <div style={{fontFamily:'Inter,sans-serif',minWidth:200,fontSize:13}}>
                    <div style={{fontWeight:700,marginBottom:6}}>{issue.title}</div>
                    <div style={{color:'#64748b',marginBottom:3}}>{issue.category}</div>
                    <div style={{marginBottom:3}}>📍 {issue.location}</div>
                    <div style={{marginBottom:6}}>Status: <b style={{color:SC[issue.status]}}>{issue.status}</b></div>
                    {issue.reporter && <div style={{fontSize:11,color:'#94a3b8'}}>Reported by: {issue.reporter}</div>}
                    {issue.department && <div style={{fontSize:11,color:'#94a3b8'}}>Dept: {issue.department}</div>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        {withCoords.length === 0 && (
          <div style={{textAlign:'center',padding:24,color:'#94a3b8',fontSize:13}}>
            No issues with location data yet. Report an issue to see it on the map.
          </div>
        )}
      </div>
    </div>
  );
}
