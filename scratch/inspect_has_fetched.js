const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const sub = c.slice(9230000, 9235000);
const idx = sub.indexOf('hasFetchedSubscriptions');
console.log('hasFetchedSubscriptions at', idx);
if (idx !== -1) {
  console.log(sub.slice(idx, idx + 400));
}
