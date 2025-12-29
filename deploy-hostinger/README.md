# Quiz App - Déploiement Hostinger

## Instructions de déploiement

1. **Transférez tous les fichiers** du dossier `deploy-hostinger` vers votre serveur Hostinger via FTP

2. **Placez les fichiers** dans le répertoire `public_html` ou le répertoire racine de votre domaine

3. **Exécutez le script de démarrage** :
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

4. **Vérifiez que le serveur fonctionne** en visitant votre site

## Dépannage

- Vérifiez les logs dans `server.log`
- Assurez-vous que le port 5000 n'est pas utilisé
- Vérifiez les permissions des fichiers

## Structure des fichiers
- `app.js` - Point d'entrée du serveur
- `server/` - Code du serveur backend
- `client/dist/` - Fichiers statiques du frontend
- `server/quiz.db` - Base de données SQLite
- `.htaccess` - Configuration Apache
- `start.sh` - Script de démarrage
