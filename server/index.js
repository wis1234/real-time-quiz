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

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Routes
app.use('/api/quiz', quizRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

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
server.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  try {
    await db.init();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
  }
});


