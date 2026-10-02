const fs = require('fs');
const c = fs.readFileSync('public/assets/c29749440865f924.js', 'utf8');

const idx = c.indexOf('859241');
console.log(c.slice(idx, idx + 1200));
