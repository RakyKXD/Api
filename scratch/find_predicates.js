const fs = require('fs');
const c = fs.readFileSync('public/assets/2e4923274c664af3.js', 'utf8');

let idx = 0;
while (true) {
  const next = c.indexOf('usePredicate', idx);
  if (next === -1) break;
  console.log('--- usePredicate at', next);
  console.log(c.slice(Math.max(0, next - 100), next + 200));
  idx = next + 12;
}
