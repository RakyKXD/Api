const fs = require('fs');
const content = fs.readFileSync('./public/assets/2e4923274c664af3.js', 'utf8');
const m = content.match(/[,;]\s*f2\s*=/);
if (m) {
  console.log('f2 = found at', m.index);
  console.log(content.slice(m.index, m.index + 600));
}
