const express = require('express');
const router = express.Router();
const db = require('../database');

// Middleware pour vérifier si l'utilisateur est admin
const checkAdmin = (req, res, next) => {
  const { candidateId } = req.body;
  
  if (!candidateId) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  try {
    const database = db.getDb();
    const stmt = database.prepare('SELECT is_admin FROM candidates WHERE id = ?');
    stmt.bind([candidateId]);
    const result = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    stmt.free();
    
    if (result.length === 0 || result[0].is_admin !== 1) {
      return res.status(403).json({ error: 'Accès refusé. Admin requis.' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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

// Obtenir tous les utilisateurs
router.post('/users', checkAdmin, (req, res) => {
  try {
    const result = db.exec(`
      SELECT id, name, email, whatsapp, score, total_questions, time_taken, 
             completed_at, created_at, is_admin
      FROM candidates
      ORDER BY created_at DESC
    `);
    
    const users = resultToObjects(result);
    res.json(users);
  } catch (error) {
    console.error('Erreur GET /admin/users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer un utilisateur
router.post('/users/delete', checkAdmin, (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }

    const database = db.getDb();
    
    // Supprimer les réponses
    const deleteAnswers = database.prepare('DELETE FROM answers WHERE candidate_id = ?');
    deleteAnswers.run([userId]);
    deleteAnswers.free();
    
    // Supprimer le candidat
    const deleteUser = database.prepare('DELETE FROM candidates WHERE id = ?');
    deleteUser.run([userId]);
    deleteUser.free();
    
    db.saveDb();
    
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Erreur DELETE /admin/users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir toutes les questions
router.post('/questions', checkAdmin, (req, res) => {
  try {
    const result = db.exec('SELECT * FROM questions ORDER BY id');
    const questions = resultToObjects(result);
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      text: q.text,
      options: JSON.parse(q.options),
      correct_answer: q.correct_answer,
      points: q.points
    }));
    res.json(formattedQuestions);
  } catch (error) {
    console.error('Erreur GET /admin/questions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ajouter une question
router.post('/questions/add', checkAdmin, (req, res) => {
  try {
    const { text, options, correct_answer, points } = req.body;
    
    if (!text || !options || !Array.isArray(options) || correct_answer === undefined) {
      return res.status(400).json({ error: 'Données invalides' });
    }

    const database = db.getDb();
    const insertStmt = database.prepare(`
      INSERT INTO questions (text, options, correct_answer, points)
      VALUES (?, ?, ?, ?)
    `);
    insertStmt.run([text, JSON.stringify(options), correct_answer, parseInt(points) || 1]);
    insertStmt.free();
    
    db.saveDb();
    
    res.json({ success: true, message: 'Question ajoutée' });
  } catch (error) {
    console.error('Erreur POST /admin/questions/add:', error);
    res.status(500).json({ error: error.message });
  }
});

// Modifier une question
router.post('/questions/update', checkAdmin, (req, res) => {
  try {
    const { id, text, options, correct_answer, points } = req.body;
    
    if (!id || !text || !options || !Array.isArray(options) || correct_answer === undefined) {
      return res.status(400).json({ error: 'Données invalides' });
    }

    const database = db.getDb();
    const updateStmt = database.prepare(`
      UPDATE questions 
      SET text = ?, options = ?, correct_answer = ?, points = ?
      WHERE id = ?
    `);
    updateStmt.run([text, JSON.stringify(options), correct_answer, parseInt(points) || 1, id]);
    updateStmt.free();
    
    db.saveDb();
    
    res.json({ success: true, message: 'Question modifiée' });
  } catch (error) {
    console.error('Erreur POST /admin/questions/update:', error);
    res.status(500).json({ error: error.message });
  }
});

// Supprimer une question
router.post('/questions/delete', checkAdmin, (req, res) => {
  try {
    const { questionId } = req.body;
    
    if (!questionId) {
      return res.status(400).json({ error: 'ID question requis' });
    }

    const database = db.getDb();
    
    // Supprimer les réponses associées
    const deleteAnswers = database.prepare('DELETE FROM answers WHERE question_id = ?');
    deleteAnswers.run([questionId]);
    deleteAnswers.free();
    
    // Supprimer la question
    const deleteQuestion = database.prepare('DELETE FROM questions WHERE id = ?');
    deleteQuestion.run([questionId]);
    deleteQuestion.free();
    
    db.saveDb();
    
    res.json({ success: true, message: 'Question supprimée' });
  } catch (error) {
    console.error('Erreur POST /admin/questions/delete:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

