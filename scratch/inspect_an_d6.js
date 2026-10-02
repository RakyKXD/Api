const fs = require('fs');
const c = fs.readFileSync('public/assets/2e4923274c664af3.js', 'utf8');

console.log('=== An ===');
const idxAn = c.indexOf('An=');
if (idxAn !== -1) console.log(c.slice(idxAn, idxAn + 800));

console.log('=== d6 ===');
const idxD6 = c.indexOf('d6=');
if (idxD6 !== -1) console.log(c.slice(idxD6, idxD6 + 800));
