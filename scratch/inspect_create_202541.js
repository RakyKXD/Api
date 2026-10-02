const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const sub = c.slice(6620027, 6620027 + 20000);
let idx = 0;
while (true) {
  const next = sub.indexOf('createFromServer', idx);
  if (next === -1) break;
  console.log('createFromServer at', next);
  console.log(sub.slice(next, next + 300));
  idx = next + 20;
}
