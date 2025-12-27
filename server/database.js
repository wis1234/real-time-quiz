const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'quiz.db');
let db = null;
let SQL = null;

const init = async () => {
  try {
    SQL = await initSqlJs();
    
    // Charger la base de données existante ou créer une nouvelle
    let buffer;
    if (fs.existsSync(dbPath)) {
      buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }
    
    // Table des questions
    db.run(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        text TEXT NOT NULL,
        options TEXT NOT NULL,
        correct_answer INTEGER NOT NULL,
        points INTEGER DEFAULT 1
      )
    `);

    // Table des candidats
    db.run(`
      CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        score INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        time_taken INTEGER DEFAULT 0,
        completed_at TEXT,
        created_at TEXT
      )
    `);

    // Table des réponses
    db.run(`
      CREATE TABLE IF NOT EXISTS answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candidate_id TEXT NOT NULL,
        question_id INTEGER NOT NULL,
        answer INTEGER NOT NULL,
        is_correct INTEGER DEFAULT 0
      )
    `);

    // Insérer des questions d'exemple si la table est vide
    const questionCount = db.exec('SELECT COUNT(*) as count FROM questions');
    if (questionCount.length > 0 && questionCount[0].values[0][0] === 0) {
      const sampleQuestions = [
        {
          text: "Quelle est la capitale de la France?",
          options: JSON.stringify(["Paris", "Londres", "Berlin", "Madrid"]),
          correct_answer: 0,
          points: 1
        },
        {
          text: "Quel est le langage de programmation le plus populaire en 2024?",
          options: JSON.stringify(["Python", "JavaScript", "Java", "C++"]),
          correct_answer: 1,
          points: 2
        },
        {
          text: "Qu'est-ce que React?",
          options: JSON.stringify(["Un framework", "Une bibliothèque", "Un langage", "Un IDE"]),
          correct_answer: 1,
          points: 2
        },
        {
          text: "Quel est le résultat de 2 + 2?",
          options: JSON.stringify(["3", "4", "5", "6"]),
          correct_answer: 1,
          points: 1
        },
        {
          text: "Quelle méthode HTTP est utilisée pour créer une ressource?",
          options: JSON.stringify(["GET", "POST", "PUT", "DELETE"]),
          correct_answer: 1,
          points: 2
        }
      ];

      for (const q of sampleQuestions) {
        const stmt = db.prepare(`
          INSERT INTO questions (text, options, correct_answer, points)
          VALUES (?, ?, ?, ?)
        `);
        stmt.run([q.text, q.options, q.correct_answer, q.points]);
        stmt.free();
      }
      
      saveDb();
      console.log('✅ Questions d\'exemple insérées');
    }

    console.log('✅ Base de données initialisée');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
};

const saveDb = () => {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
};

const getDb = () => {
  if (!db) {
    throw new Error('Base de données non initialisée. Appelez init() d\'abord.');
  }
  return db;
};

// Wrapper pour les requêtes qui sauvegardent automatiquement
const run = (sql, params = []) => {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.run(params);
  stmt.free();
  saveDb();
};

const exec = (sql) => {
  const db = getDb();
  return db.exec(sql);
};

const prepare = (sql) => {
  const db = getDb();
  return db.prepare(sql);
};

module.exports = {
  init,
  getDb,
  run,
  exec,
  prepare,
  saveDb
};
