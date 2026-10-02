const fs = require('fs');

const files = [
  'discord-assets/assets/web.d4c7976eccf337f1.js',
  'public/assets/web.d4c7976eccf337f1.js'
];

const needle = '80703(e,t,n){"use strict";function i(e){return e.split(".")[0]}function r(e){return null==e?null:i(e)}n.d(t,{d:()=>i,v:()=>r})}';
const replacement = '80703(e,t,n){"use strict";function i(e){let s=typeof e==="string"?e:(e&&e.id?e.id:String(e||""));return s.split(".")[0]}function r(e){return null==e?null:i(e)}n.d(t,{d:()=>i,v:()=>r})}';

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log('Skipping non-existent:', file);
    continue;
  }
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes(replacement)) {
    console.log('Already patched:', file);
    continue;
  }
  if (content.includes(needle)) {
    fs.writeFileSync(file, content.replace(needle, replacement), 'utf8');
    console.log('Patched:', file);
  } else {
    console.log('Needle not found in:', file);
  }
}
