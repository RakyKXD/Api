const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const sub = c.slice(2984265, 2984265 + 35000);
for (const fn of ['function ec', 'let ec=', 'const ec=', 'function ea', 'let ea=', 'const ea=']) {
  const idx = sub.indexOf(fn);
  console.log(fn, idx !== -1 ? sub.slice(idx, idx + 200) : 'not found');
}
