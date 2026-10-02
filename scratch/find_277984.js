const fs = require('fs');
for (const file of fs.readdirSync('public/assets').filter(f => f.endsWith('.js'))) {
  const c = fs.readFileSync('public/assets/' + file, 'utf8');
  if (c.includes('277984(') || c.includes('277984:(') || c.includes('277984]=')) {
    console.log('Match in', file);
    const idx = c.indexOf('277984');
    console.log(c.slice(idx, idx + 400));
  }
}
