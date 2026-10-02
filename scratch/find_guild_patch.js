const fs = require('fs');
const c = fs.readFileSync('app/api/v10/[...path]/route.ts', 'utf8');

const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes("resource === 'guilds'") && (l.includes("PATCH") || i > 1800)) {
    console.log(`Line ${i + 1}: ${l}`);
  }
});
