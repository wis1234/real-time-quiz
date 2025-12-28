const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper pour convertir les résultats
const resultToObjects = (result) => {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
};

// Obtenir les informations du candidat
router.get('/info/:candidateId', (req, res) => {
  try {
    const database = db.getDb();
    const stmt = database.prepare(`
      SELECT id, name, email, whatsapp, score, total_questions, time_taken, 
             completed_at, max_attempts, attempts_count,
             ROUND(CAST(score AS FLOAT) / (total_questions * 2) * 100, 2) as percentage
      FROM candidates
      WHERE id = ?
    `);
    stmt.bind([req.params.candidateId]);
    const result = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    stmt.free();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Candidat non trouvé' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Erreur GET /candidate/info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Vérifier si le candidat peut faire le quiz
router.get('/can-attempt/:candidateId', (req, res) => {
  try {
    const database = db.getDb();
    const stmt = database.prepare('SELECT max_attempts, attempts_count FROM candidates WHERE id = ?');
    stmt.bind([req.params.candidateId]);
    const result = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    stmt.free();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Candidat non trouvé' });
    }

    const { max_attempts, attempts_count } = result[0];
    const canAttempt = max_attempts === -1 || attempts_count < max_attempts;
    const remainingAttempts = max_attempts === -1 ? -1 : Math.max(0, max_attempts - attempts_count);

    res.json({
      canAttempt,
      remainingAttempts,
      maxAttempts: max_attempts,
      attemptsCount: attempts_count
    });
  } catch (error) {
    console.error('Erreur GET /candidate/can-attempt:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


