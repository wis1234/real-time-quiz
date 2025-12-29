#!/bin/bash

# Démarrage du serveur pour Hostinger mutualisé
# Ce script est exécuté depuis le répertoire public_html ou le répertoire racine

# Aller au répertoire du projet
cd /home/$(whoami)/domains/quiz.kemtcenter.org/public_html || cd /home/$(whoami)/domains/quiz.kemtcenter.org || exit 1

# Démarrer le serveur en arrière-plan
NODE_ENV=production nohup node app.js > server.log 2>&1 &

# Attendre quelques secondes pour que le serveur démarre
sleep 3

# Vérifier si le serveur fonctionne
if pgrep -f "node app.js" > /dev/null; then
    echo "✅ Serveur démarré avec succès"
    echo "PID: $(pgrep -f "node app.js")"
    echo "Logs: server.log"
else
    echo "❌ Erreur lors du démarrage du serveur"
    echo "Vérifiez les logs: server.log"
fi
