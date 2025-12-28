#!/bin/bash

# Installation des dépendances
cd /home/u12345678/domains/quiz.kemtcenter.org
npm install

# Construction du frontend
cd /home/u12345678/domains/quiz.kemtcenter.org/client
npm install
npm run build

# Démarrage du serveur
cd /home/u12345678/domains/quiz.kemtcenter.org
NODE_ENV=production pm2 start app.js --name quiz-app

# Sauvegarder la configuration PM2
pm2 save
pm2 startup

# Activer le démarrage automatique
systemctl enable pm2-root
