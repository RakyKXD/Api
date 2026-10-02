const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const idx = c.indexOf(',545934(');
console.log('545934 at', idx);
if (idx !== -1) {
  console.log(c.slice(idx, idx + 1000));
}
