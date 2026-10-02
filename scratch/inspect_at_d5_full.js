const fs = require('fs');
const c = fs.readFileSync('public/assets/2e4923274c664af3.js', 'utf8');

console.log('=== At full ===');
console.log(c.slice(338120, 340000));

console.log('=== d5 full ===');
console.log(c.slice(275705, 277500));
