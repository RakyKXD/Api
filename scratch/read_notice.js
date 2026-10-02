const fs = require('fs');
const content = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

console.log(content.slice(9345400, 9346500));
