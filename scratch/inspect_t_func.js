const fs = require('fs');
const content = fs.readFileSync('discord-assets/assets/web.d4c7976eccf337f1.js', 'utf8');
const start = 8782000;
console.log(content.substring(start, start + 2000));
