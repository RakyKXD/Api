const fs = require('fs');
const content = fs.readFileSync('./public/assets/web.d4c7976eccf337f1.js', 'utf8');

const idx = content.indexOf('hasTOTPEnabled(){return V.includes');
const sub = content.slice(idx - 4000, idx);
console.log('Sub before hasTOTPEnabled:');
// Search for V = 
const matches = sub.match(/(?:let|var|const)\s+[^;]+V[^;]*;/g);
console.log(matches);
