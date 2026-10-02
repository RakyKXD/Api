const fs = require('fs');
const c = fs.readFileSync('public/assets/2e4923274c664af3.js', 'utf8');

for (const name of ['At', 'd5', 'dr']) {
  let idx = 0;
  while (true) {
    const next = c.indexOf(name + '=', idx);
    if (next === -1) break;
    console.log(`=== ${name} at ${next} ===`);
    console.log(c.slice(Math.max(0, next - 40), next + 300));
    idx = next + name.length + 1;
  }
}
