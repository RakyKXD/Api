const fs = require('fs');
const c = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

const sub = c.slice(9230000, 9235000);
const idx1 = sub.indexOf('isLoadedForSKUs');
console.log('isLoadedForSKUs at', idx1);
if (idx1 !== -1) console.log(sub.slice(idx1, idx1 + 400));

const idx2 = sub.indexOf('hasPaymentSourceForSKUIds');
console.log('hasPaymentSourceForSKUIds at', idx2);
if (idx2 !== -1) console.log(sub.slice(idx2, idx2 + 400));
