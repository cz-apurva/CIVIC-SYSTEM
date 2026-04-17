// ═══════════════════════════════════════════════════════
//  SHARED ISSUE STORE
//  Single source of truth for all issues across pages.
//  Dashboard, MapView and ReportIssue all use this.
// ═══════════════════════════════════════════════════════
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ── sample data shown when backend is offline ──
const SAMPLE = [
  { _id:'1', title:'Deep Pothole near SBI ATM',    category:'Road Damage / Pothole',   location:'Rajnagar Sec 5',   severity:3, status:'In Progress', createdAt:'2026-03-15', lat:28.672, lng:77.458 },
  { _id:'2', title:'Streetlight non-functional',    category:'Broken Streetlight',      location:'Vaishali Sec 3',   severity:2, status:'Assigned',    createdAt:'2026-03-16', lat:28.645, lng:77.342 },
  { _id:'3', title:'Garbage overflowing bin',       category:'Garbage Overflow',        location:'Indirapuram',      severity:2, status:'Pending',     createdAt:'2026-03-17', lat:28.637, lng:77.364 },
  { _id:'4', title:'Water pipe burst',              category:'Water Leakage',           location:'Crossing Repub',   severity:3, status:'In Progress', createdAt:'2026-03-10', lat:28.625, lng:77.421 },
  { _id:'5', title:'Park bench broken',             category:'Damaged Public Property', location:'Nehru Park',       severity:1, status:'Resolved',    createdAt:'2026-03-08', lat:28.682, lng:77.441 },
  { _id:'6', title:'Drain blocked — flooding',      category:'Drainage Problem',        location:'Lohia Nagar',      severity:3, status:'Pending',     createdAt:'2026-03-18', lat:28.661, lng:77.399 },
];

const LS_KEY = 'scis_issues_v2';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToStorage(issues) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(issues)); } catch {}
}

// ── Context ──
const IssueContext = createContext(null);

export function IssueProvider({ children }) {
  const [issues, setIssues] = useState(() => loadFromStorage() || SAMPLE);
  const [loaded, setLoaded] = useState(false);

  // On mount: try to load from backend, fall back to localStorage / sample
  useEffect(() => {
    axios.get('/api/issues')
      .then(r => {
        if (Array.isArray(r.data) && r.data.length > 0) {
          setIssues(r.data);
          saveToStorage(r.data);
        }
      })
      .catch(() => {
        // offline — keep whatever is in state (localStorage or sample)
      })
      .finally(() => setLoaded(true));
  }, []);

  // Persist to localStorage every time issues change
  useEffect(() => {
    if (loaded) saveToStorage(issues);
  }, [issues, loaded]);

  // ── ADD new issue ──
  const addIssue = useCallback((issueData) => {
    const newIssue = {
      ...issueData,
      _id: 'local_' + Date.now(),
      createdAt: new Date().toISOString(),
      status: 'Pending',
      // Random coordinate near Ghaziabad for map pin
      lat: 28.6692 + (Math.random() - 0.5) * 0.08,
      lng: 77.4538 + (Math.random() - 0.5) * 0.08,
    };
    setIssues(prev => [newIssue, ...prev]);   // add to TOP of list
    // Also try to persist to backend
    axios.post('/api/issues', newIssue).then(r => {
      // If backend returns an ID, update the local record
      if (r.data && r.data._id) {
        setIssues(prev => prev.map(i => i._id === newIssue._id ? { ...i, _id: r.data._id } : i));
      }
    }).catch(() => {});
    return newIssue;
  }, []);

  // ── UPDATE status ──
  const updateStatus = useCallback((id, newStatus, notes = '', assignedTo = '') => {
    setIssues(prev => prev.map(i =>
      i._id === id ? { ...i, status: newStatus, notes, assignedTo } : i
    ));
    axios.put('/api/issues/' + id, { status: newStatus, notes, assignedTo }).catch(() => {});
  }, []);

  // ── CYCLE status (Next → button) ──
  const cycleStatus = useCallback((id) => {
    const flow = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
    setIssues(prev => prev.map(i => {
      if (i._id !== id) return i;
      const idx = flow.indexOf(i.status);
      const next = idx < flow.length - 1 ? flow[idx + 1] : i.status;
      axios.put('/api/issues/' + id, { status: next }).catch(() => {});
      return { ...i, status: next };
    }));
  }, []);

  // ── DELETE ──
  const deleteIssue = useCallback((id) => {
    setIssues(prev => prev.filter(i => i._id !== id));
    axios.delete('/api/issues/' + id).catch(() => {});
  }, []);

  return (
    <IssueContext.Provider value={{ issues, addIssue, updateStatus, cycleStatus, deleteIssue }}>
      {children}
    </IssueContext.Provider>
  );
}

export function useIssues() {
  const ctx = useContext(IssueContext);
  if (!ctx) throw new Error('useIssues must be inside IssueProvider');
  return ctx;
}
