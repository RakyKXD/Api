const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.next' && f !== '.git') {
        searchDir(full, pattern);
      }
    } else if (f.endsWith('.css') || f.endsWith('.js') || f.endsWith('.html')) {
      try {
        const c = fs.readFileSync(full, 'utf8');
        if (c.includes(pattern)) {
          console.log('Found', pattern, 'in:', full);
        }
      } catch (e) {}
    }
  }
}

console.log('Searching for 9271d...');
searchDir('public', '9271d');
searchDir('discord-assets', '9271d');
