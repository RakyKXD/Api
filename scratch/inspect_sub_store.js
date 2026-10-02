const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const sub = c.slice(9234000, 9236000);
const idx = sub.indexOf('BILLING_SUBSCRIPTION_FETCH_SUCCESS:');
console.log(sub.slice(Math.max(0, idx - 400), idx + 800));
