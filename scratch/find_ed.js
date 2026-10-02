const fs = require('fs');
const content = fs.readFileSync('./public/assets/d20f8741ff8d2a27.js', 'utf8');

const idx = content.indexOf('partialRoot:');
console.log(content.slice(idx - 500, idx + 200));

// Find eD.D definition
const dIdx = content.indexOf('eD=');
if (dIdx !== -1) {
  console.log('eD= found at', dIdx);
  console.log(content.slice(dIdx, dIdx + 800));
}
