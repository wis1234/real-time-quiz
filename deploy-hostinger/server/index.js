const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const db = require('./database');
const quizRoutes = require('./routes/quiz');
const scoreRoutes = require('./routes/scores');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const candidateRoutes = require('./routes/candidate');

const app = express();
const server = http.createServer(app);
// Configuration CORS pour la production
const allowedOrigins = [
  'https://quiz.kemtcenter.org',
  'http://quiz.kemtcenter.org',
  'http://localhost:5173' // Pour le développement local
];

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // En production, accepter les requêtes depuis le domaine et localhost (pour le proxy)
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin === 'http://localhost:5000') {
        callback(null, true);
      } else {
        console.log('CORS rejeté pour origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Servir les fichiers statiques du frontend en production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../client/dist');
  console.log('📁 Configuration des fichiers statiques:', staticPath);

  app.use(express.static(staticPath));

  // Gérer le routage côté client pour les applications SPA
  // IMPORTANT: Les routes API doivent être définies AVANT cette règle
  app.get('*', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    console.log('📄 Servir index.html:', indexPath);

    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.log('❌ index.html non trouvé');
      res.status(404).send('Application non trouvée. Vérifiez que le build frontend existe.');
    }
  });
}

// Routes
app.use('/api/quiz', quizRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/candidate', candidateRoutes);

// Socket.io pour les mises à jour en temps réel
io.on('connection', (socket) => {
  console.log('Client connecté:', socket.id);

  socket.on('submit-answer', (data) => {
    // Diffuser la mise à jour des scores à tous les clients
    io.emit('scores-updated');
  });

  socket.on('disconnect', () => {
    console.log('Client déconnecté:', socket.id);
  });
});

// Middleware de logging pour le debug
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Démarrer le serveur
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Répertoire de travail: ${process.cwd()}`);
  console.log(`📁 Répertoire statique: ${process.env.NODE_ENV === 'production' ? path.join(__dirname, '../client/dist') : 'Non configuré'}`);

  try {
    console.log('🔄 Initialisation de la base de données...');
    await db.init();
    console.log('✅ Base de données initialisée');

    // Vérifier le nombre de candidats et questions dans la DB
    try {
      const candidatesCount = db.exec('SELECT COUNT(*) as count FROM candidates');
      const questionsCount = db.exec('SELECT COUNT(*) as count FROM questions');
      console.log(`👥 Candidats dans DB: ${candidatesCount[0].values[0][0]}`);
      console.log(`❓ Questions dans DB: ${questionsCount[0].values[0][0]}`);
    } catch (dbError) {
      console.error('❌ Erreur vérification DB:', dbError.message);
    }

    // Vérifier que les fichiers statiques existent
    if (process.env.NODE_ENV === 'production') {
      const staticPath = path.join(__dirname, '../client/dist');
      const indexPath = path.join(staticPath, 'index.html');

      if (require('fs').existsSync(indexPath)) {
        console.log('✅ Fichier index.html trouvé:', indexPath);
      } else {
        console.log('❌ Fichier index.html manquant:', indexPath);
      }
    }

    console.log(`🔗 Socket.io actif sur le port ${PORT}`);
    console.log(`🌐 Serveur prêt à recevoir des connexions`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
  }
});

