const fs = require('fs');
const path = require('path');
const f = path.join(process.env.TEMP || '.', 'web.js');
const t = fs.readFileSync(f, 'utf8');

const idx = t.indexOf('GuildSettingsActionCreators');
const start = t.indexOf('Promise.all([', idx);
const end = t.indexOf('])', start);
const chunkCode = t.slice(start, end);
const list = [...chunkCode.matchAll(/n\.e\("(\d+)"\)/g)].map(x => x[1]);

console.log('Total chunks in GuildSettings open:', list.length);

const allFiles = fs.readdirSync('discord-assets/assets');
const missing = [];
const found = [];
for (const c of list) {
  const matches = allFiles.filter(file => file.startsWith(c + '.'));
  if (matches.length > 0) {
    found.push({ id: c, files: matches });
  } else {
    missing.push(c);
  }
}
console.log('Found:', found.length, 'Missing:', missing.length);
console.log('Missing IDs:', JSON.stringify(missing));
