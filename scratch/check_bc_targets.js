const fs = require('fs');
const c = fs.readFileSync('public/assets/bc09a629f509a816.js', 'utf8');

const target1 = '(0,p.jsx)(eg.$,{variant:"primary",text:el.intl.string(el.t.ElKTeb),onClick:function(){cI.open()},disabled:!o})';
const target2 = 'className:cS.vK,ref:e=>a(e)';

console.log('target1 in chunk:', c.includes(target1));
console.log('target2 in chunk:', c.includes(target2));
