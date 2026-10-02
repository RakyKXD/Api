const fs = require('fs');
const c = fs.readFileSync('public/assets/2e4923274c664af3.js', 'utf8');

const items = ['d7=', 'Al=', 'ds='];
for (const item of items) {
  let idx = 0;
  while (true) {
    const next = c.indexOf(item, idx);
    if (next === -1) break;
    console.log(`=== ${item} at ${next} ===`);
    console.log(c.slice(Math.max(0, next - 40), next + 200));
    idx = next + item.length;
  }
}
