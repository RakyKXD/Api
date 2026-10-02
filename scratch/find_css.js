const fs = require('fs');
const html = fs.readFileSync('public/app.html', 'utf8');
const regex = /href="\/assets\/([^"]+\.css)"/g;
let m;
const matches = [];
while ((m = regex.exec(html)) !== null) {
  matches.push(m[1]);
}
console.log('Total css in app.html:', matches.length);
for (const file of matches) {
  const p = 'public/assets/' + file;
  if (fs.existsSync(p)) {
    const c = fs.readFileSync(p, 'utf8');
    if (c.includes('container__9271d')) {
      console.log('Found in:', file);
      const idx = c.indexOf('container__9271d');
      console.log(c.substring(Math.max(0, idx - 100), Math.min(c.length, idx + 400)));
    }
  }
}
