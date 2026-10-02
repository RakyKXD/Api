const fs = require('fs');

async function search() {
  const content = fs.readFileSync('discord-assets/assets/web.d4c7976eccf337f1.js', 'utf8');
  let idx = 0;
  while ((idx = content.indexOf('getInstallationForTracking', idx)) !== -1) {
    console.log('Found at:', idx);
    console.log(content.substring(Math.max(0, idx - 150), idx + 200));
    console.log('-----------------------------------');
    idx += 'getInstallationForTracking'.length;
  }
}
search();
