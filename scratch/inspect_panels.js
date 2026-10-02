const fs = require('fs');
const c = fs.readFileSync('public/assets/2e4923274c664af3.js', 'utf8');

console.log('=== Ai ===');
const idxAi = c.indexOf('Ai=');
if (idxAi !== -1) console.log(c.slice(idxAi, idxAi + 600));

console.log('=== c4 ===');
const idxC4 = c.indexOf('c4=');
if (idxC4 !== -1) console.log(c.slice(idxC4, idxC4 + 600));

console.log('=== d4 ===');
const idxD4 = c.indexOf('d4=');
if (idxD4 !== -1) console.log(c.slice(idxD4, idxD4 + 600));
