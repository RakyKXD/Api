const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const sub = c.slice(2984265, 2984265 + 35000);
const idx = sub.indexOf('function ec(');
console.log(sub.slice(idx, idx + 800));
