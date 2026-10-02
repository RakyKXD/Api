const fs = require('fs');
const c = fs.readFileSync('public/assets/2e4923274c664af3.js', 'utf8');

// Let's search for "SUBSCRIPTIONS" or "GUILD_BOOSTING" or "BILLING"
const words = ['SUBSCRIPTIONS', 'GUILD_BOOSTING', 'BILLING', 'PREMIUM_GUILD_SUBSCRIPTIONS'];
for (const w of words) {
  let idx = 0;
  while (true) {
    const next = c.indexOf(w, idx);
    if (next === -1) break;
    console.log(`=== ${w} at ${next} ===`);
    console.log(c.slice(Math.max(0, next - 80), next + 180));
    idx = next + w.length;
  }
}
