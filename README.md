# 🎯 Quiz QCM - Application Full Stack Sophistiquée

Application de quiz QCM en ligne complète avec authentification, chronométrage, animations et espace administrateur.

## ✨ Fonctionnalités

### Pour les Candidats
- ✅ Quiz QCM avec réponses à choix multiples
- ⏱️ Chronométrage automatique du test
- 📊 Affichage de la note à la fin de l'évaluation
- 🏆 Classement de tous les participants en temps réel
- 🔐 Authentification sécurisée (Email ou WhatsApp)
- 🎨 Animations fluides avec Framer Motion
- 🔄 Mises à jour en temps réel avec Socket.io

### Pour les Administrateurs
- 👥 Gestion complète des utilisateurs (voir, supprimer)
- ❓ CRUD complet pour les questions (Ajouter, Modifier, Supprimer)
- 📈 Vue d'ensemble des scores et statistiques
- 🛡️ Interface d'administration sécurisée

## 🛠️ Technologies

### Backend
- **Express.js** - Framework web Node.js
- **Socket.io** - Communication en temps réel
- **sql.js** - Base de données SQLite (JavaScript pur)
- **CORS** - Gestion des requêtes cross-origin
- **Crypto** - Hashage des mots de passe (SHA-256)

### Frontend
- **React** - Bibliothèque UI
- **Vite** - Build tool moderne
- **React Router** - Navigation
- **Framer Motion** - Animations avancées
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
│       ├── scores.js     # Routes API pour les scores
│       ├── auth.js       # Routes d'authentification
│       └── admin.js      # Routes admin
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Home.jsx          # Page d'accueil
│   │   │   ├── Login.jsx         # Page de connexion
│   │   │   ├── Register.jsx     # Page d'inscription
│   │   │   ├── Quiz.jsx         # Composant quiz
│   │   │   ├── Timer.jsx         # Composant chronomètre
│   │   │   ├── Results.jsx      # Page de résultats
│   │   │   ├── Leaderboard.jsx # Classement
│   │   │   └── AdminDashboard.jsx  # Dashboard admin
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── package.json
```

## 🎮 Utilisation

### Pour les Candidats

1. **S'inscrire :**
   - Aller sur http://localhost:5173
   - Cliquer sur "S'inscrire"
   - Remplir le formulaire (Nom, Email, WhatsApp, Mot de passe)
   - Se connecter avec Email ou WhatsApp

2. **Passer le quiz :**
   - Se connecter avec vos identifiants
   - Répondre aux questions
   - Le chronomètre démarre automatiquement
   - Soumettre à la fin

3. **Voir les résultats :**
   - Votre score s'affiche immédiatement
   - Consulter le classement pour voir tous les participants

### Pour les Administrateurs

**Compte admin par défaut :**
- Email: `admin@quiz.com`
- Mot de passe: `admin123`

1. **Se connecter en tant qu'admin :**
   - Utiliser les identifiants admin
   - Accéder automatiquement au dashboard admin

2. **Gérer les utilisateurs :**
   - Voir tous les utilisateurs
   - Supprimer des utilisateurs (sauf autres admins)
   - Voir les scores et statistiques

3. **Gérer les questions :**
   - Ajouter de nouvelles questions
   - Modifier les questions existantes
   - Supprimer des questions
   - Définir la réponse correcte et les points

## 📝 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion (Email ou WhatsApp)

### Quiz
- `GET /api/quiz/questions` - Obtenir toutes les questions
- `GET /api/quiz/questions/:id` - Obtenir une question par ID
- `POST /api/quiz/submit` - Soumettre les réponses

### Scores
- `GET /api/scores/all` - Obtenir tous les scores
- `GET /api/scores/:candidateId` - Obtenir le score d'un candidat

### Admin (nécessite authentification admin)
- `POST /api/admin/users` - Obtenir tous les utilisateurs
- `POST /api/admin/users/delete` - Supprimer un utilisateur
- `POST /api/admin/questions` - Obtenir toutes les questions
- `POST /api/admin/questions/add` - Ajouter une question
- `POST /api/admin/questions/update` - Modifier une question
- `POST /api/admin/questions/delete` - Supprimer une question

## 🔐 Sécurité

- Mots de passe hashés avec SHA-256
- Authentification requise pour accéder au quiz
- Vérification des permissions admin pour les routes sensibles
- Protection contre les injections SQL (requêtes préparées)

## 🎨 Animations

L'application utilise **Framer Motion** pour des animations fluides :
- Transitions de pages
- Animations des boutons et cartes
- Barre de progression animée
- Effets de hover et de clic
- Modales animées

## 📊 Base de Données

La base de données SQLite contient :
- **questions** - Questions du quiz avec options et réponses correctes
- **candidates** - Informations des candidats (nom, email, WhatsApp, mot de passe, score, admin)
- **answers** - Réponses des candidats avec validation

Des questions d'exemple et un compte admin sont automatiquement créés au premier démarrage.

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

## 🎯 Fonctionnalités Avancées

- ✅ Authentification avec Email ou WhatsApp
- ✅ Système de rôles (Admin/Utilisateur)
- ✅ Dashboard admin complet
- ✅ CRUD complet pour les questions
- ✅ Gestion des utilisateurs
- ✅ Classement en temps réel
- ✅ Animations sophistiquées
- ✅ Interface responsive et moderne

## 🐛 Résolution de Problèmes

### Erreur de soumission du quiz
- Vérifiez que vous êtes bien connecté
- Assurez-vous que toutes les questions ont été répondues (ou laissées vides)
- Vérifiez la console du navigateur pour les erreurs détaillées

### Problème d'authentification
- Vérifiez que l'email/WhatsApp et le mot de passe sont corrects
- Assurez-vous d'avoir créé un compte via l'inscription

### Accès admin refusé
- Vérifiez que vous utilisez le compte admin par défaut ou un compte avec is_admin = 1
- Déconnectez-vous et reconnectez-vous

---

Développé avec ❤️ en utilisant Express.js et React
