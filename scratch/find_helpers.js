const fs = require('fs');
const c = fs.readFileSync('public/assets/2e4923274c664af3.js', 'utf8');

const funcs = ['hP', '$o', 'CD', 'zS', 'tO'];
for (const fn of funcs) {
  let idx = 0;
  while (true) {
    const next = c.indexOf('.' + fn + '(', idx);
    if (next === -1) break;
    console.log(`=== .${fn} at ${next} ===`);
    console.log(c.slice(Math.max(0, next - 40), next + 100));
    idx = next + fn.length + 2;
  }
}
