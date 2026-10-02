const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const regexes = [/,277984\(/, /277984:\(/, /277984\(/];
for (const r of regexes) {
  const match = c.search(r);
  console.log(r, '->', match);
  if (match !== -1) {
    console.log(c.slice(match, match + 400));
  }
}
