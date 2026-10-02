const fs = require('fs');
for (const file of fs.readdirSync('public/assets').filter(f => f.endsWith('.js'))) {
  const c = fs.readFileSync('public/assets/' + file, 'utf8');
  if (c.includes('USER_APPLIED_BOOSTS_FETCH')) {
    console.log('Match in', file);
    let idx = 0;
    while (true) {
      const next = c.indexOf('USER_APPLIED_BOOSTS_FETCH', idx);
      if (next === -1) break;
      console.log(c.slice(Math.max(0, next - 40), next + 200));
      idx = next + 30;
    }
  }
}
