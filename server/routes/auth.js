const express = require('express');
const router = express.Router();
const db = require('../database');
const crypto = require('crypto');

// Helper pour hasher les mots de passe
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { name, email, whatsapp, password } = req.body;
    
    if (!name || !email || !whatsapp || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    const database = db.getDb();
    
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
    const hashedPassword = hashPassword(password);
    const now = new Date().toISOString();

    const insertStmt = database.prepare(`
      INSERT INTO candidates (id, name, email, whatsapp, password, created_at, is_admin)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);
    insertStmt.run([candidateId, name, email, whatsapp, hashedPassword, now]);
    insertStmt.free();

    db.saveDb();

    res.json({
      success: true,
      candidateId,
      message: 'Inscription réussie'
    });
  } catch (error) {
    console.error('Erreur POST /register:', error);
    res.status(500).json({ error: error.message });
  }
});

// Connexion
router.post('/login', (req, res) => {
  try {
    const { email, password, whatsapp } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Mot de passe requis' });
    }

    if (!email && !whatsapp) {
      return res.status(400).json({ error: 'Email ou WhatsApp requis' });
    }

    const database = db.getDb();
    const hashedPassword = hashPassword(password);
    
    let stmt;
    if (email) {
      stmt = database.prepare('SELECT * FROM candidates WHERE email = ? AND password = ?');
      stmt.bind([email, hashedPassword]);
    } else {
      stmt = database.prepare('SELECT * FROM candidates WHERE whatsapp = ? AND password = ?');
      stmt.bind([whatsapp, hashedPassword]);
    }
    
    const result = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    stmt.free();
    
    if (result.length === 0) {
      return res.status(401).json({ error: 'Email/WhatsApp ou mot de passe incorrect' });
    }

    const candidate = result[0];
    
    res.json({
      success: true,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        whatsapp: candidate.whatsapp,
        isAdmin: candidate.is_admin === 1
      }
    });
  } catch (error) {
    console.error('Erreur POST /login:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


