const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
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
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// Servir les fichiers statiques du frontend en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // Gérer le routage côté client pour les applications SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
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

// Démarrer le serveur
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`);
  console.log(`Environnement: ${process.env.NODE_ENV || 'development'}`);
  try {
    await db.init();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
});

