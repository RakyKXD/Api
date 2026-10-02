const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const sub = c.slice(9230000, 9235000);
const idx = sub.indexOf('isLoadedForSKU(e){');
console.log('isLoadedForSKU at', idx);
if (idx !== -1) console.log(sub.slice(idx, idx + 400));

const idx2 = sub.indexOf('hasPaymentSourceForSKUId(e,t){');
console.log('hasPaymentSourceForSKUId at', idx2);
if (idx2 !== -1) console.log(sub.slice(idx2, idx2 + 400));
