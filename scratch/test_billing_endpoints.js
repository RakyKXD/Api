const http = require('http');

const endpoints = [
  '/api/v10/users/@me/billing/subscriptions',
  '/api/v10/users/@me/billing/payment-sources',
  '/api/v10/users/@me/billing/subscription-plans',
  '/api/v10/users/@me/guilds/premium/subscriptions',
  '/api/v10/users/@me/guilds/premium/subscription-slots',
  '/api/v10/users/@me/guilds/premium/subscriptions/cooldown',
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
          parsed = data;
        }
        resolve({ url, status: res.statusCode, data: parsed });
      });
    }).on('error', err => resolve({ url, status: 'ERR', error: err.message }));
  });
}

async function main() {
  console.log('Testing Subscriptions, Boosts and Nitro endpoints...');
  for (const ep of endpoints) {
    const res = await check(ep);
    const count = Array.isArray(res.data) ? `Array(${res.data.length})` : typeof res.data;
    console.log(`[${res.status}] ${ep} -> ${count}`);
    if (ep.includes('subscription-plans')) {
      const plans = res.data;
      if (Array.isArray(plans) && plans.length > 0) {
        console.log('Sample plan prices keys:', Object.keys(plans[0].prices || {}));
      }
    }
  }
}

main();
