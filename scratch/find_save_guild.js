const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

let idx = 0;
while (true) {
  const next = c.indexOf('saveGuild(', idx);
  if (next === -1) break;
  console.log('saveGuild at', next);
  console.log(c.slice(next, next + 400));
  idx = next + 20;
}
