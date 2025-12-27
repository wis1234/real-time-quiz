const express = require('express');
const router = express.Router();
const db = require('../database');

// Helper pour convertir les résultats sql.js en objets
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

// Obtenir tous les scores
router.get('/all', (req, res) => {
  try {
    const result = db.exec(`
      SELECT id, name, email, score, total_questions, time_taken, completed_at,
             ROUND(CAST(score AS FLOAT) / (total_questions * 2) * 100, 2) as percentage
      FROM candidates
      ORDER BY score DESC, time_taken ASC
    `);
    
    const scores = resultToObjects(result);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtenir le score d'un candidat spécifique
router.get('/:candidateId', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT id, name, email, score, total_questions, time_taken, completed_at,
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
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
