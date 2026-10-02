const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const idx = c.indexOf(',935208(');
console.log('935208 at', idx);
if (idx !== -1) {
  console.log(c.slice(idx, idx + 1000));
}
