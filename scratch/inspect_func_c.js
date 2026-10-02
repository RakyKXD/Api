const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const sub = c.slice(9233000, 9235200);
console.log(sub.slice(Math.max(0, sub.lastIndexOf('function C(')), sub.lastIndexOf('function C(') + 300));
