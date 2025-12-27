# 🎯 Quiz QCM - Application Full Stack

Application de quiz QCM en ligne avec chronométrage, animations et classement en temps réel.

## ✨ Fonctionnalités

- ✅ Quiz QCM avec réponses à choix multiples
- ⏱️ Chronométrage du test
- 📊 Affichage de la note à la fin de l'évaluation
- 🏆 Classement de tous les participants en temps réel
- 🎨 Animations fluides avec Framer Motion
- 🔄 Mises à jour en temps réel avec Socket.io

## 🛠️ Technologies

### Backend
- **Express.js** - Framework web Node.js
- **Socket.io** - Communication en temps réel
- **Better-SQLite3** - Base de données SQLite
- **CORS** - Gestion des requêtes cross-origin

### Frontend
- **React** - Bibliothèque UI
- **Vite** - Build tool moderne
- **React Router** - Navigation
- **Framer Motion** - Animations
- **Axios** - Client HTTP
- **Socket.io Client** - Client WebSocket

## 🚀 Installation

1. **Installer les dépendances du projet principal et du client :**
```bash
npm run install-all
```

2. **Démarrer l'application (backend + frontend) :**
```bash
npm run dev
```

Ou démarrer séparément :

**Backend uniquement :**
```bash
npm run server
```

**Frontend uniquement :**
```bash
npm run client
```

## 📁 Structure du Projet

```
recrutment/
├── server/
│   ├── index.js          # Serveur Express principal
│   ├── database.js       # Configuration SQLite
│   └── routes/
│       ├── quiz.js       # Routes API pour les quiz
│       └── scores.js     # Routes API pour les scores
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.jsx          # Page d'accueil
│   │   │   ├── Quiz.jsx          # Composant quiz
│   │   │   ├── Timer.jsx         # Composant chronomètre
│   │   │   ├── Results.jsx       # Page de résultats
│   │   │   └── Leaderboard.jsx   # Classement
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── package.json
```

## 🎮 Utilisation

1. **Accéder à l'application :**
   - Frontend : http://localhost:5173
   - Backend API : http://localhost:5000

2. **Commencer un quiz :**
   - Entrer votre nom (et email optionnel)
   - Cliquer sur "Commencer le Quiz"
   - Répondre aux questions
   - Le chronomètre démarre automatiquement

3. **Voir les résultats :**
   - Après soumission, votre score s'affiche
   - Consulter le classement pour voir tous les participants

## 📝 API Endpoints

### Quiz
- `GET /api/quiz/questions` - Obtenir toutes les questions
- `GET /api/quiz/questions/:id` - Obtenir une question par ID
- `POST /api/quiz/submit` - Soumettre les réponses

### Scores
- `GET /api/scores/all` - Obtenir tous les scores
- `GET /api/scores/:candidateId` - Obtenir le score d'un candidat

## 🎨 Animations

L'application utilise **Framer Motion** pour des animations fluides :
- Transitions de pages
- Animations des boutons
- Barre de progression animée
- Effets de hover et de clic

## 📊 Base de Données

La base de données SQLite contient :
- **questions** - Questions du quiz
- **candidates** - Informations des candidats
- **answers** - Réponses des candidats

Des questions d'exemple sont automatiquement créées au premier démarrage.

## 🔧 Configuration

Les ports par défaut sont :
- Backend : 5000
- Frontend : 5173

Vous pouvez les modifier dans :
- `server/index.js` pour le backend
- `client/vite.config.js` pour le frontend

## 📦 Scripts Disponibles

- `npm run dev` - Démarrer backend + frontend
- `npm run server` - Démarrer uniquement le backend
- `npm run client` - Démarrer uniquement le frontend
- `npm run install-all` - Installer toutes les dépendances

## 🎯 Prochaines Améliorations Possibles

- Authentification utilisateur
- Gestion de plusieurs quiz
- Statistiques détaillées
- Export des résultats
- Mode administrateur

---

Développé avec ❤️ en utilisant Express.js et React


