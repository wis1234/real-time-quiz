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

// Obtenir toutes les questions
router.get('/questions', (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

// Obtenir une question par ID
router.get('/questions/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM questions WHERE id = ?');
    stmt.bind([req.params.id]);
    const result = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    stmt.free();
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Question non trouvée' });
    }

    const question = result[0];
    res.json({
      id: question.id,
      text: question.text,
      options: JSON.parse(question.options),
      correct_answer: question.correct_answer,
      points: question.points
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Soumettre les réponses d'un candidat
router.post('/submit', (req, res) => {
  try {
    const { candidateId, candidateName, email, answers, timeTaken } = req.body;
    
    if (!candidateId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Données invalides' });
    }

    const database = db.getDb();
    const insertAnswer = database.prepare(`
      INSERT INTO answers (candidate_id, question_id, answer, is_correct)
      VALUES (?, ?, ?, ?)
    `);

    const getQuestion = database.prepare('SELECT correct_answer, points FROM questions WHERE id = ?');
    
    let totalScore = 0;
    let totalQuestions = answers.length;

    // Traiter chaque réponse
    for (const answer of answers) {
      getQuestion.bind([answer.questionId]);
      const questionResult = [];
      while (getQuestion.step()) {
        questionResult.push(getQuestion.getAsObject());
      }
      getQuestion.free();
      
      if (questionResult.length > 0) {
        const question = questionResult[0];
        const isCorrect = answer.selectedAnswer === question.correct_answer;
        if (isCorrect) {
          totalScore += question.points;
        }
        insertAnswer.run([candidateId, answer.questionId, answer.selectedAnswer, isCorrect ? 1 : 0]);
      }
    }

    insertAnswer.free();

    // Vérifier si le candidat existe
    const checkCandidate = database.prepare('SELECT id FROM candidates WHERE id = ?');
    checkCandidate.bind([candidateId]);
    const candidateResult = [];
    while (checkCandidate.step()) {
      candidateResult.push(checkCandidate.getAsObject());
    }
    checkCandidate.free();
    
    const now = new Date().toISOString();
    
    if (candidateResult.length > 0) {
      const updateStmt = database.prepare(`
        UPDATE candidates 
        SET score = ?, total_questions = ?, time_taken = ?, completed_at = ?
        WHERE id = ?
      `);
      updateStmt.run([totalScore, totalQuestions, timeTaken, now, candidateId]);
      updateStmt.free();
    } else {
      const insertStmt = database.prepare(`
        INSERT INTO candidates (id, name, email, score, total_questions, time_taken, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertStmt.run([candidateId, candidateName || 'Anonyme', email || null, totalScore, totalQuestions, timeTaken, now]);
      insertStmt.free();
    }

    db.saveDb();

    res.json({
      success: true,
      score: totalScore,
      totalQuestions: totalQuestions,
      percentage: Math.round((totalScore / (totalQuestions * 2)) * 100) // Approximation basée sur points moyens
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
