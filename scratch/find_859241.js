const fs = require('fs');
for (const file of fs.readdirSync('public/assets').filter(f => f.endsWith('.js'))) {
  const c = fs.readFileSync('public/assets/' + file, 'utf8');
  if (c.includes('859241(') || c.includes('859241:(') || c.includes('859241]=')) {
    console.log('Match in', file);
    const idx = c.indexOf('859241');
    console.log(c.slice(idx, idx + 400));
  }
}
