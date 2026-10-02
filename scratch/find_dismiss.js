const fs = require('fs');
const content = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');

function findAction(name) {
  let pos = 0;
  while ((pos = content.indexOf(name, pos)) !== -1) {
    console.log(`=== ${name} at ${pos} ===`);
    console.log(content.slice(Math.max(0, pos - 150), pos + 250));
    pos += name.length;
  }
}

findAction('NOTICE_DISMISS');
findAction('DC_DISMISSED');
