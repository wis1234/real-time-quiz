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
    
    // Vérifier si les réponses sont publiques
    const settingsResult = db.exec('SELECT show_answers FROM quiz_settings ORDER BY id DESC LIMIT 1');
    const showAnswers = settingsResult.length > 0 && settingsResult[0].values[0] && settingsResult[0].values[0][0] === 1;
    
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      text: q.text,
      options: JSON.parse(q.options),
      correct_answer: showAnswers ? q.correct_answer : undefined,
      points: q.points,
      showAnswer: showAnswers
    }));
    res.json({ questions: formattedQuestions, showAnswers });
  } catch (error) {
    console.error('Erreur GET /questions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtenir les paramètres du quiz (délai, etc.)
router.get('/settings', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM quiz_settings ORDER BY id DESC LIMIT 1');
    if (result.length > 0) {
      const settings = resultToObjects(result)[0];
      res.json({
        timeLimit: settings.time_limit || 0,
        showAnswers: settings.show_answers === 1
      });
    } else {
      res.json({ timeLimit: 0, showAnswers: false });
    }
  } catch (error) {
    console.error('Erreur GET /quiz/settings:', error);
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
    console.error('Erreur GET /questions/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

// Soumettre les réponses d'un candidat
router.post('/submit', (req, res) => {
  try {
    const { candidateId, candidateName, email, whatsapp, answers, timeTaken } = req.body;
    
    if (!candidateId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Données invalides' });
    }

    const database = db.getDb();
    
    // Vérifier les tentatives
    const checkAttempts = database.prepare('SELECT max_attempts, attempts_count FROM candidates WHERE id = ?');
    checkAttempts.bind([candidateId]);
    const attemptsResult = [];
    while (checkAttempts.step()) {
      attemptsResult.push(checkAttempts.getAsObject());
    }
    checkAttempts.free();
    
    if (attemptsResult.length > 0) {
      const { max_attempts, attempts_count } = attemptsResult[0];
      // -1 signifie illimité
      if (max_attempts !== -1 && attempts_count >= max_attempts) {
        return res.status(403).json({ 
          error: `Vous avez atteint la limite de ${max_attempts} tentative(s). Contactez l'administrateur.` 
        });
      }
    }
    
    let totalScore = 0;
    let totalQuestions = answers.length;

    // Traiter chaque réponse
    for (const answer of answers) {
      // Recréer la requête pour chaque question
      const getQuestion = database.prepare('SELECT correct_answer, points FROM questions WHERE id = ?');
      getQuestion.bind([answer.questionId]);
      const questionResult = [];
      while (getQuestion.step()) {
        questionResult.push(getQuestion.getAsObject());
      }
      getQuestion.free();
      
      if (questionResult.length > 0) {
        const question = questionResult[0];
        const isCorrect = answer.selectedAnswer !== -1 && answer.selectedAnswer === question.correct_answer;
        if (isCorrect) {
          totalScore += question.points;
        }
        
        // Insérer la réponse
        const insertAnswer = database.prepare(`
          INSERT INTO answers (candidate_id, question_id, answer, is_correct)
          VALUES (?, ?, ?, ?)
        `);
        insertAnswer.run([candidateId, answer.questionId, answer.selectedAnswer, isCorrect ? 1 : 0]);
        insertAnswer.free();
      }
    }

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
        SET score = ?, total_questions = ?, time_taken = ?, completed_at = ?, attempts_count = attempts_count + 1
        WHERE id = ?
      `);
      updateStmt.run([totalScore, totalQuestions, timeTaken, now, candidateId]);
      updateStmt.free();
    } else {
      const insertStmt = database.prepare(`
        INSERT INTO candidates (id, name, email, whatsapp, score, total_questions, time_taken, completed_at, attempts_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);
      insertStmt.run([candidateId, candidateName || 'Anonyme', email || null, whatsapp || null, totalScore, totalQuestions, timeTaken, now]);
      insertStmt.free();
    }

    db.saveDb();

    // Récupérer les détails des réponses pour l'affichage
    const answerDetails = [];
    for (const answer of answers) {
      const getQuestion = database.prepare('SELECT * FROM questions WHERE id = ?');
      getQuestion.bind([answer.questionId]);
      const questionResult = [];
      while (getQuestion.step()) {
        questionResult.push(getQuestion.getAsObject());
      }
      getQuestion.free();
      
      if (questionResult.length > 0) {
        const question = questionResult[0];
        const isCorrect = answer.selectedAnswer !== -1 && answer.selectedAnswer === question.correct_answer;
        answerDetails.push({
          questionId: question.id,
          questionText: question.text,
          options: JSON.parse(question.options),
          correctAnswer: question.correct_answer,
          selectedAnswer: answer.selectedAnswer,
          isCorrect: isCorrect,
          points: question.points
        });
      }
    }

    res.json({
      success: true,
      score: totalScore,
      totalQuestions: totalQuestions,
      percentage: totalQuestions > 0 ? Math.round((totalScore / (totalQuestions * 2)) * 100) : 0,
      answerDetails: answerDetails
    });
  } catch (error) {
    console.error('Erreur POST /submit:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
