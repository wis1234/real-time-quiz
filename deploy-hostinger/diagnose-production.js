const https = require('https');

console.log('🔍 Diagnostic de production pour https://quiz.kemtcenter.org\n');

// Fonction pour tester un endpoint
function testEndpoint(path, description) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'quiz.kemtcenter.org',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Diagnostic-Script',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`📋 ${description}:`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);

        try {
          const jsonData = JSON.parse(data);
          console.log(`   Data: ${JSON.stringify(jsonData, null, 2)}`);
        } catch (e) {
          console.log(`   Raw response: ${data.substring(0, 200)}...`);
        }
        console.log('');
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${description}: ERREUR - ${err.message}\n`);
      resolve({ error: err.message });
    });

    req.setTimeout(10000, () => {
      console.log(`⏰ ${description}: TIMEOUT\n`);
      req.destroy();
      resolve({ error: 'Timeout' });
    });

    req.end();
  });
}

// Tester tous les endpoints critiques
async function runDiagnostics() {
  console.log('🚀 Test des endpoints API...\n');

  const endpoints = [
    { path: '/', description: 'Page d\'accueil' },
    { path: '/api/quiz/questions', description: 'Questions du quiz' },
    { path: '/api/scores/all', description: 'Classement général' },
    { path: '/api/candidate/info/test-id', description: 'Infos candidat' },
    { path: '/socket.io/?EIO=4&transport=polling', description: 'Socket.io handshake' }
  ];

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.path, endpoint.description);
  }

  console.log('✅ Diagnostic terminé');
  console.log('\n💡 Conseils de dépannage :');
  console.log('1. Vérifiez que le serveur Node.js fonctionne sur le port 5000');
  console.log('2. Vérifiez les logs du serveur dans server.log');
  console.log('3. Vérifiez que la base de données quiz.db existe et contient des données');
  console.log('4. Vérifiez la configuration du proxy Apache dans .htaccess');
}

runDiagnostics().catch(console.error);
