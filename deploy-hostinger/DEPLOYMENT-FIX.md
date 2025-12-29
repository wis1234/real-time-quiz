# 🚀 Correction des problèmes de production - Quiz App

## 🔍 Diagnostic des problèmes identifiés

### Problèmes détectés :
1. **❌ API retourne HTML au lieu de JSON** : Le proxy Apache ne fonctionne pas correctement
2. **❌ Données vides en dashboard** : Les requêtes API ne passent pas
3. **❌ Classement non affiché** : Même problème API
4. **❌ Socket.io erreur 400** : Configuration CORS incorrecte

### Cause principale :
Le fichier `.htaccess` ne proxy pas correctement les requêtes `/api/*` vers le serveur Node.js sur le port 5000.

## 🛠️ Solution appliquée

### 1. Correction du .htaccess
```apache
Options -MultiViews
RewriteEngine On

# API proxy vers Node.js - Configuration Hostinger
RewriteCond %{REQUEST_URI} ^/api/
RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]

# Socket.io proxy
RewriteCond %{REQUEST_URI} ^/socket.io/
RewriteRule ^socket.io/(.*)$ http://localhost:5000/socket.io/$1 [P,L]

# Servir les fichiers statiques directement
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# SPA routing - servir index.html pour toutes les autres routes
RewriteRule ^ index.html [L]
```

### 2. Amélioration de la configuration Socket.io
- Ajout du support pour `http://localhost:5000` dans CORS
- Ajout des credentials et méthodes supplémentaires

### 3. Logs de debug améliorés
- Vérification du nombre de candidats/questions dans la DB au démarrage
- Logs détaillés pour diagnostiquer les problèmes

## 📋 Instructions de déploiement

### Étape 1 : Connexion SSH à Hostinger
```bash
ssh votre-utilisateur@quiz.kemtcenter.org
```

### Étape 2 : Sauvegarde (optionnel mais recommandé)
```bash
cd /home/votre-utilisateur/domains/quiz.kemtcenter.org/public_html
cp -r . ../backup-$(date +%Y%m%d-%H%M%S)
```

### Étape 3 : Téléchargement des fichiers corrigés
Transférez via FTP le contenu du dossier `deploy-hostinger/` vers `public_html/`

### Étape 4 : Redémarrage du serveur
```bash
cd /home/votre-utilisateur/domains/quiz.kemtcenter.org/public_html
chmod +x restart-hostinger.sh
./restart-hostinger.sh
```

### Étape 5 : Vérification
```bash
./check-hostinger.sh
```

## 🔧 Scripts disponibles

### restart-hostinger.sh
Redémarre proprement le serveur Node.js en tuant les processus existants.

### check-hostinger.sh
Vérifie l'état du serveur, les fichiers et teste les endpoints API.

### diagnose-production.js
Script de diagnostic pour tester les endpoints depuis l'extérieur.

## 🚨 Dépannage

### Si le serveur ne démarre pas :
```bash
# Vérifier les logs
tail -50 server.log

# Vérifier les permissions
ls -la app.js server/index.js server/quiz.db

# Tuer les processus bloquants
pkill -9 node
```

### Si les API ne fonctionnent toujours pas :
1. Vérifiez que `.htaccess` est bien déployé
2. Vérifiez que le module `mod_proxy` est activé sur Hostinger
3. Testez directement : `curl http://localhost:5000/api/quiz/questions`

### Si Socket.io ne fonctionne pas :
- Vérifiez que le port 5000 est ouvert
- Testez : `curl http://localhost:5000/socket.io/?EIO=4&transport=polling`

## ✅ Vérifications finales

Après redémarrage, testez :

1. **Page d'accueil** : https://quiz.kemtcenter.org/
2. **Connexion candidat** : Devrait charger les données du dashboard
3. **Classement** : Devrait afficher les scores
4. **Socket.io** : Plus d'erreur 400 dans la console

## 📞 Support

Si les problèmes persistent :
1. Exécutez `./check-hostinger.sh` et partagez la sortie
2. Vérifiez les logs : `tail -100 server.log`
3. Testez les endpoints directement depuis SSH :
   ```bash
   curl http://localhost:5000/api/scores/all
   curl http://localhost:5000/api/candidate/info/votre-id
   ```

---

**🎯 Résultat attendu** : Le dashboard candidat devrait maintenant afficher les mêmes données qu'en local !
