const fs = require('fs');
const content = fs.readFileSync('./public/assets/2e4923274c664af3.js', 'utf8');
const pos = 506166;
console.log(content.slice(pos - 1500, pos + 500));
