const fs = require('fs');
const files = fs.readdirSync('./public/assets').filter(f => f.endsWith('.js'));
for (const file of files) {
  const content = fs.readFileSync('./public/assets/' + file, 'utf8');
  if (content.includes('411364(e,t,n)') || content.includes('411364:')) {
    console.log('Module 411364 is in', file);
    const idx = content.indexOf('411364');
    console.log(content.slice(idx, idx + 800));
    break;
  }
}
