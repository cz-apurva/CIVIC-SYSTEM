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
    const res = await axios.post('/api/bert-priority', { title, description, category }, { timeout: 20000 });
    const d   = res.data;
    // Validate — if score is NaN or missing, use fallback
    if (!d || isNaN(Number(d.bert_score))) throw new Error('invalid score');
    return {
      bert_score:      Math.round(Number(d.bert_score)),
      bert_label:      d.bert_label      || 'Medium',
      bert_confidence: parseFloat(d.bert_confidence) || 0.5,
      bert_method:     d.method          || 'BERT',
    };
  } catch {
    // BERT offline → keyword fallback — never returns NaN
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

  // Helper to get auth header
  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // 1. FETCH ISSUES
  useEffect(() => {
  // 1. Get the token from wherever you stored it (usually localStorage)
  const token = localStorage.getItem('token'); 

  // 2. Add the headers to the axios call
  axios.get('/api/issues/all', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(r => { 
      if (Array.isArray(r.data)) { 
        setIssues(r.data); 
        saveToStorage(r.data); 
      } 
    })
    .catch(err => {
      console.error("Fetch failed:", err.response?.data || err.message);
    })
    .finally(() => setLoaded(true));
}, []);

  // 2. ADD ISSUE
  const addIssue = useCallback(async (issueData) => {
    const tempId = 'local_' + Date.now();
    const quickScore = keywordPriorityScore(issueData.title, issueData.description, issueData.category);

    const newIssue = { ...issueData, ...quickScore, _id: tempId, createdAt: new Date().toISOString(), status: 'Pending' };
    setIssues(prev => [newIssue, ...prev]);

    // Background BERT + Server Sync
    try {
      const bertResult = await callBERT(issueData.title, issueData.description, issueData.category);
      
      // Note: your backend expects "/api/issues/report" based on your previous code
      const response = await axios.post('/api/issues/report', 
        { ...newIssue, ...bertResult }, 
        getAuthHeader()
      );

      setIssues(prev => prev.map(i => 
        i._id === tempId ? { ...i, ...bertResult, _id: response.data.id } : i
      ));
    } catch (err) {
      console.error("Sync failed", err);
    }
  }, []);

  // 3. UPDATE STATUS
  const updateStatus = useCallback((id, newStatus, notes = '', assignedTo = '') => {
    setIssues(prev => prev.map(i =>
      i._id === id ? { ...i, status: newStatus, notes, assignedTo, updatedAt: new Date().toISOString() } : i
    ));
    // Fixed endpoint to match ID routing
    axios.put(`/api/issues/${id}`, { status: newStatus, notes, assignedTo }, getAuthHeader()).catch(() => {});
  }, []);

  // 4. DELETE
  const deleteIssue = useCallback((id) => {
    setIssues(prev => prev.filter(i => i._id !== id));
    axios.delete(`/api/issues/${id}`, getAuthHeader()).catch(() => {});
  }, []);

  return (
    <IssueContext.Provider value={{ issues, addIssue, updateStatus, deleteIssue }}>
      {children}
    </IssueContext.Provider>
  );
}

export function useIssues() {
  const ctx = useContext(IssueContext);
  if (!ctx) {
    throw new Error('useIssues must be used within an IssueProvider');
  }
  return ctx;
}