const fs = require('fs');
const path = require('path');

console.log('🚀 Préparation du déploiement pour Hostinger...\n');

// Créer le répertoire de déploiement
const deployDir = 'deploy-hostinger';
if (!fs.existsSync(deployDir)) {
  fs.mkdirSync(deployDir);
  console.log('✅ Répertoire deploy-hostinger créé');
}

// Fonction pour copier un fichier ou répertoire
function copyFile(src, dest) {
  try {
    if (fs.statSync(src).isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      const files = fs.readdirSync(src);
      files.forEach(file => {
        copyFile(path.join(src, file), path.join(dest, file));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
    return true;
  } catch (error) {
    console.log(`⚠️  Impossible de copier ${src}: ${error.message}`);
    return false;
  }
}

// Copier les fichiers nécessaires
const filesToCopy = [
  // Serveur
  'server/index.js',
  'server/database.js',
  'server/routes/quiz.js',
  'server/routes/scores.js',
  'server/routes/auth.js',
  'server/routes/admin.js',
  'server/routes/candidate.js',

  // Frontend build
  'client/dist/index.html',
  'client/dist/assets',

  // Fichiers de configuration
  '.htaccess',
  'start.sh',
  'app.js',

  // Base de données
  'server/quiz.db'
];

// Copier chaque fichier
filesToCopy.forEach(file => {
  const srcPath = path.join(__dirname, file);
  const destPath = path.join(__dirname, deployDir, file);

  if (fs.existsSync(srcPath)) {
    copyFile(srcPath, destPath);
    console.log(`✅ Copié: ${file}`);
  } else {
    console.log(`⚠️  Fichier manquant: ${file}`);
  }
});

// Créer un package.json minimal pour Hostinger (au cas où)
const minimalPackage = {
  "name": "quiz-app-production",
  "version": "1.0.0",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "debug": "NODE_ENV=development node app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "socket.io": "^4.6.1",
    "sql.js": "^1.10.3",
    "uuid": "^9.0.1"
  }
};

fs.writeFileSync(path.join(deployDir, 'package.json'), JSON.stringify(minimalPackage, null, 2));
console.log('✅ package.json minimal créé');

// Créer un README pour le déploiement
const readme = `# Quiz App - Déploiement Hostinger

## Instructions de déploiement

1. **Transférez tous les fichiers** du dossier \`deploy-hostinger\` vers votre serveur Hostinger via FTP

2. **Placez les fichiers** dans le répertoire \`public_html\` ou le répertoire racine de votre domaine

3. **Exécutez le script de démarrage** :
   \`\`\`bash
   chmod +x start.sh
   ./start.sh
   \`\`\`

4. **Vérifiez que le serveur fonctionne** en visitant votre site

## Dépannage

- Vérifiez les logs dans \`server.log\`
- Assurez-vous que le port 5000 n'est pas utilisé
- Vérifiez les permissions des fichiers

## Structure des fichiers
- \`app.js\` - Point d'entrée du serveur
- \`server/\` - Code du serveur backend
- \`client/dist/\` - Fichiers statiques du frontend
- \`server/quiz.db\` - Base de données SQLite
- \`.htaccess\` - Configuration Apache
- \`start.sh\` - Script de démarrage
`;

fs.writeFileSync(path.join(deployDir, 'README.md'), readme);
console.log('✅ README.md créé');

console.log('\n🎉 Déploiement préparé !');
console.log('📁 Tous les fichiers sont dans le dossier deploy-hostinger/');
console.log('📤 Transférez ce dossier sur Hostinger via FTP');
console.log('🚀 Exécutez ensuite ./start.sh sur le serveur');
