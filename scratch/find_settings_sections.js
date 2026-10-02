const fs = require('fs');
const c = fs.readFileSync('public/assets/2e4923274c664af3.js', 'utf8');

const regex = /section:[a-zA-Z0-9_.]+/g;
const matches = Array.from(new Set(c.match(regex) || []));
console.log('Sections found:');
matches.forEach(m => console.log(m));
