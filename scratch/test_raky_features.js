const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TOKEN = 'mfa.mock_discord_token_' + Buffer.from('900000000000000001').toString('base64');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Authorization': TOKEN,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) { json = data; }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Iniciando Tests de Características de Raky...\n');
  let passed = 0;
  let total = 0;

  async function test(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`❌ [FAIL] ${name}:`, e.message);
    }
  }

  // 1. Triple Perfil: Consultar personas
  await test('GET /users/@me/personas (Triple Perfil)', async () => {
    const res = await request('GET', '/api/v10/users/@me/personas');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.personas?.gaming || !res.body.personas?.professional || !res.body.personas?.intimate) {
      throw new Error('Faltan perfiles en personas');
    }
  });

  // 2. Triple Perfil: Alternar a perfil Profesional
  await test('PUT /users/@me/personas/active (Cambiar a Profesional)', async () => {
    const res = await request('PUT', '/api/v10/users/@me/personas/active', { active_persona: 'professional' });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.active_persona !== 'professional') throw new Error(`Esperado 'professional', recibido '${res.body.active_persona}'`);
  });

  // 3. Crear Servidor Cifrado E2EE (Límite 1.000 miembros, Privado)
  let createdEncryptedGuildId = null;
  await test('POST /guilds (Crear Servidor Cifrado E2EE)', async () => {
    const res = await request('POST', '/api/v10/guilds', {
      name: 'Raky E2EE Secret Hub',
      is_encrypted: true,
      features: ['ENCRYPTED_E2EE']
    });
    if (res.status !== 201) throw new Error(`Status ${res.status}`);
    if (!res.body.is_encrypted) throw new Error('is_encrypted debe ser true');
    if (res.body.max_members !== 1000) throw new Error(`max_members debe ser 1000, recibido: ${res.body.max_members}`);
    createdEncryptedGuildId = res.body.id;
  });

  // 4. Clave de Cifrado del Canal
  await test('GET /channels/{id}/encryption-key (Zero-Knowledge Key)', async () => {
    // Usar canal general del guild recién creado
    const guildRes = await request('GET', `/api/v10/guilds/${createdEncryptedGuildId}`);
    const channelId = guildRes.body.channels[0].id;
    const res = await request('GET', `/api/v10/channels/${channelId}/encryption-key`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.key) throw new Error('Falta la clave de cifrado');
    if (res.body.encrypted !== true) throw new Error('encrypted debe ser true');
  });

  // 5. Ajustes y Personalidad de Clyde AI en Servidor
  await test('PATCH /guilds/{id}/clyde-settings (Personalizar Clyde AI)', async () => {
    const res = await request('PATCH', `/api/v10/guilds/${createdEncryptedGuildId}/clyde-settings`, {
      name: 'Clyde Guardián',
      personality: 'Eres Clyde Guardián, el protector del servidor cifrado.',
      description: 'IA protectora'
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.name !== 'Clyde Guardián') throw new Error(`Nombre no actualizado: ${res.body.name}`);
  });

  // 6. Consultar Ajustes de Clyde AI
  await test('GET /guilds/{id}/clyde-settings', async () => {
    const res = await request('GET', `/api/v10/guilds/${createdEncryptedGuildId}/clyde-settings`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (res.body.personality !== 'Eres Clyde Guardián, el protector del servidor cifrado.') {
      throw new Error(`Personalidad inesperada: ${res.body.personality}`);
    }
  });

  // 7. Foros con Karma: Votar Upvote y Downvote estilo Reddit
  await test('Karma de Foros (Upvote, Downvote y Score)', async () => {
    const guildRes = await request('GET', `/api/v10/guilds/${createdEncryptedGuildId}`);
    const channelId = guildRes.body.channels[0].id;

    // Crear un mensaje para votar
    const msgRes = await request('POST', `/api/v10/channels/${channelId}/messages`, {
      content: 'Publicación de debate en foro sobre ciberseguridad'
    });
    if (msgRes.status !== 201) throw new Error(`No se pudo crear mensaje: status ${msgRes.status}`);
    const messageId = msgRes.body.id;

    // Upvote
    const upRes = await request('POST', `/api/v10/channels/${channelId}/messages/${messageId}/karma`, { vote: 1 });
    if (upRes.status !== 200) throw new Error(`Status ${upRes.status}`);
    if (upRes.body.score !== 1) throw new Error(`Esperado score 1, recibido ${upRes.body.score}`);

    // Downvote
    const downRes = await request('POST', `/api/v10/channels/${channelId}/messages/${messageId}/karma`, { vote: -1 });
    if (downRes.status !== 200) throw new Error(`Status ${downRes.status}`);
    if (downRes.body.score !== -1) throw new Error(`Esperado score -1, recibido ${downRes.body.score}`);
  });

  // 8. Rescate de Cuenta Hackeada: Consulta de DMs Sospechosos
  await test('GET /users/@me/security/suspicious-dms (Detección de Spam)', async () => {
    const res = await request('GET', '/api/v10/users/@me/security/suspicious-dms');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!Array.isArray(res.body)) throw new Error('Debe responder un array');
  });

  // 9. Verificación de Bots por Niveles e Inspección IA
  await test('POST /applications/{id}/verify-bot (Auditoría IA y DNI)', async () => {
    const res = await request('POST', '/api/v10/applications/123456789/verify-bot', {
      repo_url: 'https://github.com/raky/verified-bot',
      dni_doc: 'DOC_HASH_9823472'
    });
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.audit_passed) throw new Error('audit_passed debe ser true');
    if (!res.body.dni_verified) throw new Error('dni_verified debe ser true');
  });

  // 10. Eliminar / Salir del Servidor
  await test('DELETE /guilds/{id} (Eliminar Servidor)', async () => {
    const res = await request('DELETE', `/api/v10/guilds/${createdEncryptedGuildId}`);
    if (res.status !== 204) throw new Error(`Status ${res.status}`);

    // Comprobar que ya no existe
    const checkRes = await request('GET', `/api/v10/guilds/${createdEncryptedGuildId}`);
    if (checkRes.status !== 404) throw new Error(`Esperado 404, recibido ${checkRes.status}`);
  });

  // 11. Assets estáticos de Raky en el frontend
  await test('GET /assets/raky-client.js & raky-client.css', async () => {
    const jsRes = await request('GET', '/assets/raky-client.js');
    if (jsRes.status !== 200) throw new Error(`raky-client.js status ${jsRes.status}`);
    const cssRes = await request('GET', '/assets/raky-client.css');
    if (cssRes.status !== 200) throw new Error(`raky-client.css status ${cssRes.status}`);
  });

  console.log(`\n🎉 Resumen: ${passed}/${total} tests superados con éxito.`);
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
