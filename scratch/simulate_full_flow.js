const http = require('http');

async function get(path) {
  return new Promise((resolve) => {
    http.get('http://localhost:3000' + path, {
      headers: { 'Authorization': 'dummy' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ path, status: res.statusCode, data: data.length < 200 ? data : data.slice(0, 100) + '...' });
      });
    }).on('error', err => resolve({ path, status: 'ERROR', error: err.message }));
  });
}

async function run() {
  const steps = [
    // 1. App page
    '/app.html',
    
    // 2. Bad domains
    '/bad-domains/current_revision.txt',
    
    // 3. Changelogs
    '/changelogs/config_xxx.json',
    
    // 4. Status API
    '/api/v2/scheduled-maintenances/upcoming.json',
    '/api/v2/incidents/unresolved.json',
    
    // 5. Post connection open calls
    '/api/v10/users/@me/activities/statistics/top-games',
    '/api/v10/sticker-packs',
    '/api/v10/sticker-packs/753016829956423700',
    '/api/v10/stickers/847199849233514549',
    '/auth/sessions',
    '/api/v10/auth/sessions',
    '/api/v10/users/@me',
    '/api/v10/users/@me/profile',
    '/api/v10/users/@me/billing/subscriptions',
    '/api/v10/users/@me/billing/payment-sources',
    '/api/v10/oauth2/tokens',
    '/api/v10/users/@me/pomelo-eligibility',
    '/api/v10/users/@me/harvest',
    '/api/v10/users/@me/consent',
    '/api/v10/users/@me/agreements',
    '/api/v10/users/@me/email-settings',
    '/api/v10/users/@me/clan'
  ];

  console.log('Testing full flow...');
  for (const s of steps) {
    const res = await get(s);
    const ok = res.status === 200;
    console.log(`[${ok ? 'OK' : 'FAIL'}] ${res.status} ${s} -> ${res.data}`);
  }
}

run();
