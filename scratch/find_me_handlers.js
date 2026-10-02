const fs = require('fs');
const c = fs.readFileSync('app/api/v10/[...path]/route.ts', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes("resource === 'users'") && l.includes("@me")) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});
