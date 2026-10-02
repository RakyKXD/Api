const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const sub = c.slice(9230000, 9236000);
const startMod = sub.lastIndexOf('("use strict")');
const modHeader = sub.slice(sub.lastIndexOf('\n,', 9235198 - 9230000));
console.log(sub.slice(Math.max(0, 9235198 - 9230000 - 1000), 9235198 - 9230000));
