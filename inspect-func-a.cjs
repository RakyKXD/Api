const fs = require('fs');

const content = fs.readFileSync('discord-assets/assets/web.d4c7976eccf337f1.js', 'utf8');
const startIdx = content.indexOf('openUserSettings:()=>A');
const pStart = content.indexOf('let{default:t}=await Promise.all([', startIdx);
const pEnd = content.indexOf(']);', pStart);
console.log('Code after Promise.all in openUserSettings:');
console.log(content.slice(pEnd - 50, pEnd + 400));
