const fs = require('fs');
for (const file of fs.readdirSync('public/assets').filter(f => f.endsWith('.js'))) {
  const c = fs.readFileSync('public/assets/' + file, 'utf8');
  if (c.includes('820739(') || c.includes('820739:(') || c.includes('820739]=')) {
    console.log('Match in', file);
    const idx = c.indexOf('820739');
    console.log(c.slice(idx, idx + 400));
  }
}
