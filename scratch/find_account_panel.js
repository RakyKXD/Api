const fs = require('fs');
const content = fs.readFileSync('./public/assets/2e4923274c664af3.js', 'utf8');

const idx = content.indexOf('ACCOUNT_PANEL');
console.log('ACCOUNT_PANEL in 2e4923274c664af3.js at', idx);
if (idx !== -1) {
  console.log(content.slice(idx - 100, idx + 600));
}
