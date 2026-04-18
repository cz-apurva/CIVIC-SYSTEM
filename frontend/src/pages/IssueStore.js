// ═══════════════════════════════════════════════════════════════
//  SHARED ISSUE STORE — BERT Priority + SMS via backend
//  Fix: BERT score NaN → use keyword-based fallback when offline
//  Fix: SMS sent through Node backend (avoids CORS)
// ═══════════════════════════════════════════════════════════════
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// ── Keyword-based BERT fallback (runs in browser when BERT offline) ──
// Mirrors what bert_service.py does but without the model
function keywordPriorityScore(title, description, category) {
  const text = `${title} ${description} ${category}`.toLowerCase();

  const highWords   = ['accident','burst','flood','flooding','collapse','danger','emergency','injury','death','sewage','contamination','fire','hazard','broken road','no water','cave'];
  const medWords    = ['pothole','overflow','leakage','leaking','blocked','dark','street light','garbage','drain','not working','damage','repair'];
  const lowWords    = ['bench','paint','faded','cosmetic','minor','small','worn','sign','aesthetic'];

  let score = 50; // neutral start

  highWords.forEach(w => { if (text.includes(w)) score += 12; });
  medWords.forEach(w  => { if (text.includes(w)) score += 5;  });
  lowWords.forEach(w  => { if (text.includes(w)) score -= 8;  });

  // Category boost
  if (category === 'Water Leakage'   || category === 'Drainage Problem') score += 8;
  if (category === 'Road Damage / Pothole')                               score += 6;
  if (category === 'Damaged Public Property')                             score -= 5;

  score = Math.max(0, Math.min(100, Math.round(score)));

  const label      = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';
  const confidence = parseFloat((score / 100).toFixed(2));
  return { bert_score: score, bert_label: label, bert_confidence: confidence, bert_method: 'keyword-fallback' };
}

// ── Call real BERT via Node backend ──
async function callBERT(title, description, category) {
  try {
    // Reduced timeout to 3 seconds so the user doesn't wait forever for a 404
    const res = await axios.post('/api/bert-priority', 
      { title, description, category }, 
      { timeout: 3000 } 
    );
    
    const d = res.data;
    if (!d || isNaN(Number(d.bert_score))) throw new Error('invalid score');

    return {
      bert_score:      Math.round(Number(d.bert_score)),
      bert_label:      d.bert_label      || 'Medium',
      bert_confidence: parseFloat(d.bert_confidence) || 0.5,
      bert_method:     d.method          || 'BERT',
    };
  } catch (error) {
    // This catches the 404 or Timeout and uses your browser-side keyword logic
    console.warn("BERT service unreachable. Using keyword-based fallback.");
    return keywordPriorityScore(title, description, category);
  }
}

const SAMPLE = [
  { _id:'1', title:'Deep Pothole near SBI ATM',  category:'Road Damage / Pothole',   location:'Rajnagar Sec 5', severity:3, status:'In Progress', createdAt:'2026-03-15', lat:28.672, lng:77.458, bert_score:82, bert_label:'High',   bert_confidence:0.82, bert_method:'BERT', reporter:'Demo Citizen', phone:'' },
  { _id:'2', title:'Streetlight non-functional', category:'Broken Streetlight',      location:'Vaishali Sec 3', severity:2, status:'Assigned',    createdAt:'2026-03-16', lat:28.645, lng:77.342, bert_score:61, bert_label:'Medium', bert_confidence:0.61, bert_method:'BERT', reporter:'Demo Citizen', phone:'' },
  { _id:'3', title:'Garbage overflowing bin',    category:'Garbage Overflow',        location:'Indirapuram',    severity:2, status:'Pending',     createdAt:'2026-03-17', lat:28.637, lng:77.364, bert_score:55, bert_label:'Medium', bert_confidence:0.55, bert_method:'BERT', reporter:'Demo Citizen', phone:'' },
  { _id:'4', title:'Water pipe burst',           category:'Water Leakage',           location:'Crossing Repub', severity:3, status:'In Progress', createdAt:'2026-03-10', lat:28.625, lng:77.421, bert_score:91, bert_label:'High',   bert_confidence:0.91, bert_method:'BERT', reporter:'Demo Citizen', phone:'' },
  { _id:'5', title:'Park bench broken',          category:'Damaged Public Property', location:'Nehru Park',     severity:1, status:'Resolved',    createdAt:'2026-03-08', lat:28.682, lng:77.441, bert_score:22, bert_label:'Low',    bert_confidence:0.78, bert_method:'BERT', reporter:'Demo Citizen', phone:'' },
  { _id:'6', title:'Drain blocked — flooding',   category:'Drainage Problem',        location:'Lohia Nagar',    severity:3, status:'Pending',     createdAt:'2026-03-18', lat:28.661, lng:77.399, bert_score:88, bert_label:'High',   bert_confidence:0.88, bert_method:'BERT', reporter:'Demo Citizen', phone:'' },
];

const LS_KEY = 'scis_issues_v4';
function loadFromStorage() { try { const r = localStorage.getItem(LS_KEY); if (r) return JSON.parse(r); } catch {} return null; }
function saveToStorage(issues) { try { localStorage.setItem(LS_KEY, JSON.stringify(issues)); } catch {} }

const IssueContext = createContext(null);

export function IssueProvider({ children }) {
  const [issues, setIssues] = useState(() => loadFromStorage() || SAMPLE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    axios.get('/api/issues')
      .then(r => { if (Array.isArray(r.data) && r.data.length > 0) { setIssues(r.data); saveToStorage(r.data); } })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => { if (loaded) saveToStorage(issues); }, [issues, loaded]);

  // ── ADD ISSUE — BERT score immediately (never NaN) ──
  const addIssue = useCallback(async (issueData) => {
    const tempId = 'local_' + Date.now();

    // Run keyword fallback FIRST so score shows immediately
    const quickScore = keywordPriorityScore(issueData.title, issueData.description, issueData.category);

    const newIssue = {
      ...issueData,
      _id:       tempId,
      createdAt: new Date().toISOString(),
      status:    'Pending',
      ...quickScore,   // immediate non-NaN score
    };
    setIssues(prev => [newIssue, ...prev]);

    // Then try real BERT in background — upgrade if better
    callBERT(issueData.title, issueData.description, issueData.category)
      .then(bertResult => {
        setIssues(prev => prev.map(i =>
          i._id === tempId ? { ...i, ...bertResult } : i
        ));
        axios.post('/api/issues', { ...newIssue, ...bertResult }).catch(() => {});
      });

    return newIssue;
  }, []);

  // ── UPDATE STATUS — called by authority only ──
  const updateStatus = useCallback((id, newStatus, notes = '', assignedTo = '') => {
    setIssues(prev => prev.map(i =>
      i._id === id ? { ...i, status: newStatus, notes, assignedTo, updatedAt: new Date().toISOString() } : i
    ));
    axios.put('/api/issues/' + id, { status: newStatus, notes, assignedTo }).catch(() => {});
  }, []);

  // ── CYCLE STATUS removed from citizen dashboard ──
  // Citizens cannot change status — only Authority can via updateStatus()

  // ── DELETE ──
  const deleteIssue = useCallback((id) => {
    setIssues(prev => prev.filter(i => i._id !== id));
    axios.delete('/api/issues/' + id).catch(() => {});
  }, []);

  return (
    <IssueContext.Provider value={{ issues, addIssue, updateStatus, deleteIssue }}>
      {children}
    </IssueContext.Provider>
  );
}

export function useIssues() {
  const ctx = useContext(IssueContext);
  if (!ctx) throw new Error('useIssues must be inside IssueProvider');
  return ctx;
}
