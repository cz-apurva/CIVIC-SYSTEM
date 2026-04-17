// ═══════════════════════════════════════════════════════
//  backend/routes/bert.js
//  Node.js route that calls the Python BERT microservice
// ═══════════════════════════════════════════════════════
const express = require('express');
const axios   = require('axios');
const router  = express.Router();

const BERT_URL = process.env.BERT_SERVICE_URL || 'http://localhost:5001';

// POST /api/bert-priority
// Body: { title, description, category }
router.post('/bert-priority', async (req, res) => {
  const { title, description, category } = req.body;

  if (!title && !description) {
    return res.status(400).json({ error: 'title or description is required' });
  }

  try {
    const response = await axios.post(`${BERT_URL}/api/bert-priority`, {
      title:       title       || '',
      description: description || '',
      category:    category    || '',
    }, { timeout: 30000 });

    return res.json(response.data);

  } catch (err) {
    console.error('[BERT] Service error:', err.message);
    // Fallback: if BERT is offline, return a neutral score
    return res.json({
      bert_score:      50,
      bert_label:      'Medium',
      bert_confidence: 0.5,
      method:          'fallback (BERT offline)',
      error:           'BERT service unavailable',
    });
  }
});

module.exports = router;
