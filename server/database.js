const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
        whatsapp TEXT,
        password TEXT,
        score INTEGER DEFAULT 0,
        total_questions INTEGER DEFAULT 0,
        time_taken INTEGER DEFAULT 0,
        completed_at TEXT,
        created_at TEXT,
        is_admin INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT -1,
        attempts_count INTEGER DEFAULT 0
      )
    `);
    
    // Migrations pour les nouvelles colonnes
    const migrations = [
      { sql: 'ALTER TABLE candidates ADD COLUMN whatsapp TEXT', name: 'whatsapp' },
      { sql: 'ALTER TABLE candidates ADD COLUMN password TEXT', name: 'password' },
      { sql: 'ALTER TABLE candidates ADD COLUMN is_admin INTEGER DEFAULT 0', name: 'is_admin' },
      { sql: 'ALTER TABLE candidates ADD COLUMN max_attempts INTEGER DEFAULT -1', name: 'max_attempts' },
      { sql: 'ALTER TABLE candidates ADD COLUMN attempts_count INTEGER DEFAULT 0', name: 'attempts_count' }
    ];
    
    migrations.forEach(migration => {
      try {
        db.run(migration.sql);
      } catch (e) {
        // Colonne existe déjà, ignorer
      }
    });

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

    // Table des paramètres du quiz
    db.run(`
      CREATE TABLE IF NOT EXISTS quiz_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        time_limit INTEGER DEFAULT 0,
        show_answers INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insérer les paramètres par défaut si la table est vide
    const settingsCount = db.exec('SELECT COUNT(*) as count FROM quiz_settings');
    if (settingsCount.length > 0 && settingsCount[0].values[0][0] === 0) {
      const defaultSettings = db.prepare(`
        INSERT INTO quiz_settings (time_limit, show_answers)
        VALUES (0, 0)
      `);
      defaultSettings.run();
      defaultSettings.free();
      saveDb();
    }

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

    // Créer un admin par défaut si aucun admin n'existe
    const adminCount = db.exec('SELECT COUNT(*) as count FROM candidates WHERE is_admin = 1');
    if (adminCount.length > 0 && adminCount[0].values[0][0] === 0) {
      const adminId = crypto.randomUUID();
      const adminPassword = crypto.createHash('sha256').update('admin123').digest('hex');
      const adminStmt = db.prepare(`
        INSERT INTO candidates (id, name, email, whatsapp, password, is_admin, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `);
      adminStmt.run([
        adminId,
        'Administrateur',
        'admin@quiz.com',
        '+33123456789',
        adminPassword,
        new Date().toISOString()
      ]);
      adminStmt.free();
      saveDb();
      console.log('✅ Admin par défaut créé (email: admin@quiz.com, password: admin123)');
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
