const fs = require('fs');

const content = fs.readFileSync('public/assets/a2ba2be1945d9431.js', 'utf8');

const regex = /"[a-zA-Z0-9+/=]+":\["[^"]*regalo[^"]*"\]/g;
const matches = content.match(regex) || [];
for (const m of matches) {
  if (m.includes('enviado') || m.includes('pero')) {
    console.log(m);
  }
}
