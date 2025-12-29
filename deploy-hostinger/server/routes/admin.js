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
             completed_at, created_at, is_admin, max_attempts, attempts_count
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

// Créer un utilisateur
router.post('/users/create', checkAdmin, (req, res) => {
  try {
    const { name, email, whatsapp, password, maxAttempts } = req.body;
    
    if (!name || !email || !whatsapp || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const database = db.getDb();
    const crypto = require('crypto');
    
    // Vérifier si l'email existe déjà
    const checkEmail = database.prepare('SELECT id FROM candidates WHERE email = ?');
    checkEmail.bind([email]);
    const emailResult = [];
    while (checkEmail.step()) {
      emailResult.push(checkEmail.getAsObject());
    }
    checkEmail.free();
    
    if (emailResult.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Vérifier si le WhatsApp existe déjà
    const checkWhatsapp = database.prepare('SELECT id FROM candidates WHERE whatsapp = ?');
    checkWhatsapp.bind([whatsapp]);
    const whatsappResult = [];
    while (checkWhatsapp.step()) {
      whatsappResult.push(checkWhatsapp.getAsObject());
    }
    checkWhatsapp.free();
    
    if (whatsappResult.length > 0) {
      return res.status(400).json({ error: 'Ce numéro WhatsApp est déjà utilisé' });
    }

    const candidateId = crypto.randomUUID();
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const now = new Date().toISOString();
    const maxAttemptsValue = maxAttempts === 'unlimited' ? -1 : parseInt(maxAttempts) || -1;

    const insertStmt = database.prepare(`
      INSERT INTO candidates (id, name, email, whatsapp, password, created_at, is_admin, max_attempts, attempts_count)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?, 0)
    `);
    insertStmt.run([candidateId, name, email, whatsapp, hashedPassword, now, maxAttemptsValue]);
    insertStmt.free();

    db.saveDb();

    res.json({ success: true, message: 'Utilisateur créé avec succès' });
  } catch (error) {
    console.error('Erreur POST /admin/users/create:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour les tentatives max d'un utilisateur
router.post('/users/update-attempts', checkAdmin, (req, res) => {
  try {
    const { userId, maxAttempts } = req.body;
    
    if (!userId || maxAttempts === undefined) {
      return res.status(400).json({ error: 'Données invalides' });
    }

    const database = db.getDb();
    const maxAttemptsValue = maxAttempts === 'unlimited' ? -1 : parseInt(maxAttempts) || -1;
    
    const updateStmt = database.prepare('UPDATE candidates SET max_attempts = ? WHERE id = ?');
    updateStmt.run([maxAttemptsValue, userId]);
    updateStmt.free();
    
    db.saveDb();
    
    res.json({ success: true, message: 'Limite de tentatives mise à jour' });
  } catch (error) {
    console.error('Erreur POST /admin/users/update-attempts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Modifier un utilisateur
router.post('/users/update', checkAdmin, (req, res) => {
  try {
    const { userId, name, email, whatsapp, password } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'ID utilisateur requis' });
    }

    const database = db.getDb();
    const crypto = require('crypto');
    
    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const values = [];
    
    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (whatsapp) {
      updates.push('whatsapp = ?');
      values.push(whatsapp);
    }
    if (password) {
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }
    
    values.push(userId);
    const updateStmt = database.prepare(`UPDATE candidates SET ${updates.join(', ')} WHERE id = ?`);
    updateStmt.run(values);
    updateStmt.free();
    
    db.saveDb();
    
    res.json({ success: true, message: 'Utilisateur mis à jour' });
  } catch (error) {
    console.error('Erreur POST /admin/users/update:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les paramètres du quiz
router.post('/settings', checkAdmin, (req, res) => {
  try {
    const result = db.exec('SELECT * FROM quiz_settings ORDER BY id DESC LIMIT 1');
    if (result.length > 0) {
      const settings = resultToObjects(result)[0];
      res.json(settings);
    } else {
      res.json({ time_limit: 0, show_answers: 0 });
    }
  } catch (error) {
    console.error('Erreur GET /admin/settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mettre à jour les paramètres du quiz
router.post('/settings/update', checkAdmin, (req, res) => {
  try {
    const { timeLimit, showAnswers } = req.body;
    
    const database = db.getDb();
    const now = new Date().toISOString();
    
    // Vérifier si des paramètres existent
    const checkSettings = database.prepare('SELECT id FROM quiz_settings ORDER BY id DESC LIMIT 1');
    const settingsResult = [];
    while (checkSettings.step()) {
      settingsResult.push(checkSettings.getAsObject());
    }
    checkSettings.free();
    
    if (settingsResult.length > 0) {
      const updateStmt = database.prepare(`
        UPDATE quiz_settings 
        SET time_limit = ?, show_answers = ?, updated_at = ?
        WHERE id = ?
      `);
      updateStmt.run([parseInt(timeLimit) || 0, showAnswers ? 1 : 0, now, settingsResult[0].id]);
      updateStmt.free();
    } else {
      const insertStmt = database.prepare(`
        INSERT INTO quiz_settings (time_limit, show_answers, created_at, updated_at)
        VALUES (?, ?, ?, ?)
      `);
      insertStmt.run([parseInt(timeLimit) || 0, showAnswers ? 1 : 0, now, now]);
      insertStmt.free();
    }
    
    db.saveDb();
    
    res.json({ success: true, message: 'Paramètres mis à jour' });
  } catch (error) {
    console.error('Erreur POST /admin/settings/update:', error);
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

