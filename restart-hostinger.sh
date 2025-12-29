#!/bin/bash

echo "🔄 Redémarrage du serveur Quiz sur Hostinger..."
echo "📍 Répertoire: $(pwd)"
echo "👤 Utilisateur: $(whoami)"
echo "📅 Date: $(date)"

# Aller dans le bon répertoire
cd /home/$(whoami)/domains/quiz.kemtcenter.org/public_html 2>/dev/null || cd /home/$(whoami)/domains/quiz.kemtcenter.org 2>/dev/null || echo "❌ Impossible de trouver le répertoire du domaine"

# Tuer les processus Node.js existants
echo "🛑 Arrêt des processus Node.js existants..."
pkill -f "node app.js" 2>/dev/null || echo "Aucun processus Node.js trouvé"
pkill -f "node server/index.js" 2>/dev/null || echo "Aucun processus serveur trouvé"
sleep 2

# Vérifier que les fichiers existent
if [ ! -f "app.js" ]; then
    echo "❌ app.js non trouvé"
    exit 1
fi

if [ ! -f "server/index.js" ]; then
    echo "❌ server/index.js non trouvé"
    exit 1
fi

if [ ! -f "server/quiz.db" ]; then
    echo "❌ Base de données quiz.db non trouvée"
    exit 1
fi

# Donner les permissions nécessaires
chmod +x app.js 2>/dev/null
chmod +x server/index.js 2>/dev/null
chmod 644 server/quiz.db 2>/dev/null

echo "✅ Fichiers vérifiés"

# Démarrer le serveur en arrière-plan
echo "🚀 Démarrage du serveur..."
NODE_ENV=production nohup node app.js > server.log 2>&1 &

# Attendre le démarrage
sleep 5

# Vérifier que le serveur fonctionne
if pgrep -f "node app.js" > /dev/null; then
    echo "✅ Serveur démarré avec succès"
    echo "🆔 PID: $(pgrep -f "node app.js")"
    echo "📝 Logs: server.log"

    # Tester rapidement les endpoints
    echo "🧪 Test des endpoints..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/quiz/questions | grep -q "200"; then
        echo "✅ API questions: OK"
    else
        echo "❌ API questions: ÉCHEC"
    fi

    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/scores/all | grep -q "200"; then
        echo "✅ API scores: OK"
    else
        echo "❌ API scores: ÉCHEC"
    fi

else
    echo "❌ Échec du démarrage du serveur"
    echo "📝 Vérifiez les logs: server.log"
    echo "📄 Contenu des logs:"
    tail -20 server.log 2>/dev/null || echo "Pas de logs disponibles"
fi

echo ""
echo "🎯 Pour vérifier le statut: pgrep -f 'node app.js'"
echo "📋 Pour voir les logs: tail -f server.log"
echo "🛑 Pour arrêter: pkill -f 'node app.js'"
