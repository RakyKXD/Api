const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const idx = c.indexOf('isFetchingCurrentUserAppliedBoosts');
console.log('isFetchingCurrentUserAppliedBoosts at', idx);
if (idx !== -1) {
  console.log(c.slice(Math.max(0, idx - 200), idx + 500));
}
