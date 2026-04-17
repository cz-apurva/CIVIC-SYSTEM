# ═══════════════════════════════════════════════════════════════
#  BERT Priority Scoring Microservice — SCIS
#  Uses bert-base-uncased to score civic complaint text
#  Run: python bert_service.py
#  Listens on: http://localhost:5001
# ═══════════════════════════════════════════════════════════════

from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import BertTokenizer, BertModel
import numpy as np
import re

app = Flask(__name__)
CORS(app)

# ── Load BERT once at startup ──
print("Loading BERT model... (this takes 30-60 seconds on first run)")
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model     = BertModel.from_pretrained('bert-base-uncased')
model.eval()
print("BERT ready.")

# ── Civic urgency keywords with weights ──
# BERT embeddings are compared against these reference phrases
# to produce a 0-100 priority score
URGENT_PHRASES = [
    "dangerous safety hazard emergency urgent accident death injury",
    "flooding blocked drain sewage overflow disease contamination",
    "burst pipe water leakage road collapse structural damage",
    "pothole accident vehicle damage dangerous road condition",
    "no water supply power outage streetlight not working dark road",
]
LOW_PHRASES = [
    "minor inconvenience small issue cosmetic damage",
    "broken bench park maintenance aesthetic issue",
    "painting faded sign worn out minor repair needed",
]

def get_embedding(text):
    """Get BERT [CLS] token embedding for a piece of text."""
    inputs = tokenizer(
        text,
        return_tensors='pt',
        max_length=128,
        truncation=True,
        padding=True
    )
    with torch.no_grad():
        outputs = model(**inputs)
    # Use [CLS] token embedding as sentence representation
    cls_embedding = outputs.last_hidden_state[:, 0, :].squeeze().numpy()
    return cls_embedding

def cosine_similarity(a, b):
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))

# Pre-compute reference embeddings at startup
print("Computing reference embeddings...")
urgent_embeddings = [get_embedding(p) for p in URGENT_PHRASES]
low_embeddings    = [get_embedding(p) for p in LOW_PHRASES]
print("Reference embeddings ready.")

def bert_priority_score(title, description, category):
    """
    Use BERT to compute a 0-100 priority score from complaint text.
    
    Method:
    1. Combine title + description + category into one text
    2. Get BERT embedding for the complaint
    3. Compute cosine similarity against urgent and low reference phrases
    4. Scale similarity scores to 0-100 priority score
    """
    combined_text = f"{title} {description} {category}".strip().lower()
    combined_text = re.sub(r'\s+', ' ', combined_text)

    if not combined_text:
        return 50.0, "Medium", 0.5

    complaint_emb = get_embedding(combined_text)

    # Similarity to urgent phrases
    urgent_sims = [cosine_similarity(complaint_emb, e) for e in urgent_embeddings]
    max_urgent  = max(urgent_sims)
    avg_urgent  = float(np.mean(urgent_sims))

    # Similarity to low-priority phrases
    low_sims = [cosine_similarity(complaint_emb, e) for e in low_embeddings]
    max_low  = max(low_sims)

    # Net urgency score: how much more similar to urgent vs low
    net_urgency = (max_urgent * 0.7 + avg_urgent * 0.3) - (max_low * 0.5)

    # Scale to 0-100
    # net_urgency typically ranges from -0.2 to +0.4
    score = float(np.clip((net_urgency + 0.2) / 0.6 * 100, 0, 100))
    score = round(score, 2)

    # Label and confidence
    if score >= 70:
        label      = "High"
        confidence = round(score / 100, 2)
    elif score >= 40:
        label      = "Medium"
        confidence = round(score / 100, 2)
    else:
        label      = "Low"
        confidence = round((100 - score) / 100, 2)

    return score, label, confidence

@app.route('/api/bert-priority', methods=['POST'])
def priority():
    data = request.get_json()
    if not data:
        return jsonify({ 'error': 'No data provided' }), 400

    title       = data.get('title', '')
    description = data.get('description', '')
    category    = data.get('category', '')

    if not title and not description:
        return jsonify({ 'error': 'title or description required' }), 400

    score, label, confidence = bert_priority_score(title, description, category)

    return jsonify({
        'bert_score':      score,
        'bert_label':      label,
        'bert_confidence': confidence,
        'method':          'BERT (bert-base-uncased)',
        'input_text':      f"{title} {description}"[:200],
    })

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({ 'status': 'ok', 'model': 'bert-base-uncased' })

if __name__ == '__main__':
    app.run(port=5001, debug=False)
