const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');
const chunks = ['443159', '82721', '674832', '549091', '692513', '209114', '70798'];
for (const ch of chunks) {
  const needle = ch + ':';
  const idx = c.indexOf(needle);
  console.log(ch, 'idx:', idx);
  if (idx !== -1) {
    console.log(ch, 'slice:', c.slice(idx, idx + 50));
  }
}
