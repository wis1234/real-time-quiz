#!/bin/bash

echo "🔍 Vérification du statut du serveur Quiz sur Hostinger"
echo "📍 Répertoire: $(pwd)"
echo "👤 Utilisateur: $(whoami)"
echo "📅 Date: $(date)"
echo ""

# Vérifier les processus Node.js
echo "🔍 Processus Node.js:"
if pgrep -f "node app.js" > /dev/null; then
    PID=$(pgrep -f "node app.js")
    echo "✅ Serveur en cours d'exécution (PID: $PID)"
    ps aux | grep "node app.js" | grep -v grep
else
    echo "❌ Aucun serveur Node.js en cours d'exécution"
fi
echo ""

# Vérifier les fichiers critiques
echo "📁 Vérification des fichiers:"
files=("app.js" "server/index.js" "server/quiz.db" ".htaccess" "index.html")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ $file manquant"
    fi
done
echo ""

# Vérifier la base de données
echo "🗄️ Vérification de la base de données:"
if [ -f "server/quiz.db" ]; then
    echo "✅ Fichier quiz.db trouvé ($(stat -c%s server/quiz.db 2>/dev/null || stat -f%z server/quiz.db 2>/dev/null || echo "taille inconnue") bytes)"
else
    echo "❌ Base de données manquante"
fi
echo ""

# Tester les endpoints locaux
echo "🧪 Test des endpoints API (localhost):"
endpoints=("/api/quiz/questions" "/api/scores/all" "/api/candidate/info/test")
for endpoint in "${endpoints[@]}"; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000$endpoint | grep -q "200"; then
        echo "✅ $endpoint: OK"
    else
        echo "❌ $endpoint: ÉCHEC"
    fi
done
echo ""

# Vérifier les logs récents
echo "📝 Logs récents (dernières 10 lignes):"
if [ -f "server.log" ]; then
    tail -10 server.log
else
    echo "❌ Fichier server.log non trouvé"
fi
echo ""

echo "💡 Commandes utiles:"
echo "  Redémarrer: ./restart-hostinger.sh"
echo "  Voir logs: tail -f server.log"
echo "  Arrêter: pkill -f 'node app.js'"
