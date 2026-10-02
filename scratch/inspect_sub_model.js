const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const idx = c.indexOf('class Subscription');
console.log('class Subscription at', idx);
if (idx !== -1) {
  console.log(c.slice(idx, idx + 800));
} else {
  // Let's find module 202541
  const modIdx = c.indexOf(',202541(');
  console.log('202541 at', modIdx);
  if (modIdx !== -1) console.log(c.slice(modIdx, modIdx + 800));
}
