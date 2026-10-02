const fs = require('fs');
const content = fs.readFileSync('./public/assets/2e4923274c664af3.js', 'utf8');
const pos = 506166;
const sub = content.slice(pos - 10000, pos);
const idx = sub.lastIndexOf('f2=');
console.log('f2= at', idx);
if (idx !== -1) console.log(sub.slice(idx, idx + 600));
