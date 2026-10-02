const fs = require('fs');
const content = fs.readFileSync('./public/assets/2e4923274c664af3.js', 'utf8');

let pos = 0;
while ((pos = content.indexOf('ACCOUNT_PANEL', pos)) !== -1) {
  console.log('Pos:', pos, '-->', content.slice(Math.max(0, pos - 50), pos + 250));
  pos += 13;
}
