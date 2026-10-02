const fs = require('fs');
const c = fs.readFileSync('public/assets/2e4923274c664af3.js', 'utf8');

let idx = 0;
while (true) {
  const next = c.indexOf('SETTINGS_PREMIUM', idx);
  if (next === -1) break;
  console.log('--- Found SETTINGS_PREMIUM at', next);
  console.log(c.slice(Math.max(0, next - 150), next + 250));
  idx = next + 16;
}
