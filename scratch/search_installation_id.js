const fs = require('fs');

const content = fs.readFileSync('discord-assets/assets/web.d4c7976eccf337f1.js', 'utf8');
let idx = 0;
while ((idx = content.indexOf('INSTALLATION_ID', idx)) !== -1) {
  console.log('Found INSTALLATION_ID at:', idx);
  console.log(content.substring(Math.max(0, idx - 100), idx + 150));
  console.log('-----------------------------------');
  idx += 'INSTALLATION_ID'.length;
}
