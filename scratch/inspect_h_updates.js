const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const sub = c.slice(9230000, 9235000);
let idx = 0;
while (true) {
  const next = sub.indexOf('h[', idx);
  if (next === -1) break;
  console.log('h[ at', next);
  console.log(sub.slice(Math.max(0, next - 40), next + 100));
  idx = next + 2;
}
