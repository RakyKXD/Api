const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const idx = c.indexOf('useSubscriptionPlansLoaded');
console.log(c.slice(idx, idx + 1000));
