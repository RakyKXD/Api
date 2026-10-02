const fs = require('fs');
const content = fs.readFileSync('./public/assets/d20f8741ff8d2a27.js', 'utf8');

const idx = content.indexOf('382567(e,t,n)');
console.log('382567 length in chunk:', content.length);
// Find e6 definition
const e6Idx = content.indexOf('function e6(');
if (e6Idx !== -1) {
  console.log('e6 function found at', e6Idx);
  console.log(content.slice(e6Idx, e6Idx + 1200));
} else {
  // Let's find e6 = 
  const e6Var = content.indexOf('e6=');
  console.log('e6= at', e6Var);
  console.log(content.slice(e6Var, e6Var + 1200));
}
