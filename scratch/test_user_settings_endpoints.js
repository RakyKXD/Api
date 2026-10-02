const http = require('http');

const endpoints = [
  // Settings core
  '/api/v10/users/@me',
  '/api/v10/users/@me/profile',
  '/api/v10/users/@me/settings',
  '/api/v10/users/@me/settings-proto/1',
  '/api/v10/users/@me/settings-proto/2',
  
  // Account & Security
  '/api/v10/users/@me/mfa/totp',
  '/api/v10/users/@me/mfa/webauthn/credentials',
  '/api/v10/users/@me/phone-affinities',
  '/api/v10/users/@me/email-settings',
  '/api/v10/users/@me/harvest',
  '/api/v10/users/@me/consent',
  '/api/v10/users/@me/safety-hub/classifications',
  
  // Connections & Apps
  '/api/v10/users/@me/connections',
  '/api/v10/oauth2/tokens',
  '/api/v10/users/@me/application-identities',
  '/api/v10/users/@me/application-identities/v2',
  
  // Billing & Nitro
  '/api/v10/users/@me/billing/subscriptions',
  '/api/v10/users/@me/billing/payment-sources',
  '/api/v10/users/@me/billing/payments',
  '/api/v10/users/@me/billing/invoices',
  '/api/v10/users/@me/billing/nitro-affinity',
  '/api/v10/users/@me/billing/country-code',
  '/api/v10/users/@me/entitlements',
  '/api/v10/users/@me/outbound-promotions',
  '/api/v10/users/@me/guilds/premium/subscriptions',
  '/api/v10/users/@me/guilds/premium/subscriptions/cooldown',
  '/api/v10/users/@me/burst-credits',
  '/api/v10/users/@me/virtual-currency/balance',
  
  // Notifications & Voice/Video
  '/api/v10/users/@me/notification-settings',
  '/api/v10/users/@me/notification-settings/snapshots',
  '/api/v10/users/@me/video-filters/assets',
  
  // Guild settings
  '/api/v10/guilds/1790692561769/top-emojis',
  '/api/v10/guilds/1790692561769/application-command-index'
];

async function check(url) {
  return new Promise((resolve) => {
    http.get('http://localhost:3000' + url, {
      headers: { 'Authorization': 'dummy' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = 'NON_JSON: ' + data.slice(0, 50);
        }
        resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, data: parsed });
      });
    }).on('error', err => resolve({ url, status: 'ERR', ok: false, error: err.message }));
  });
}

async function main() {
  console.log('Testing User Settings & Guild Settings endpoints...');
  let failed = 0;
  for (const ep of endpoints) {
    const res = await check(ep);
    const isArray = Array.isArray(res.data);
    const isObj = res.data && typeof res.data === 'object' && !isArray;
    const typeStr = isArray ? `Array(${res.data.length})` : isObj ? `Object(${Object.keys(res.data).length})` : typeof res.data;
    if (!res.ok) {
      failed++;
      console.log(`❌ FAIL [${res.status}] ${ep}`);
    } else {
      console.log(`✅ OK [${res.status}] ${ep} -> ${typeStr}`);
    }
  }
  console.log(`\nDone. Failures: ${failed}/${endpoints.length}`);
}

main();
