const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('discord-assets/assets/web.d4c7976eccf337f1.js', 'utf8');

const uIdx = content.indexOf('T.u=');
const nextT = content.indexOf(',T.', uIdx + 5);
const uDef = content.slice(uIdx, nextT);

const kIdx = content.indexOf('T.k=');
const nextK = content.indexOf(',T.', kIdx + 5);
const kDef = content.slice(kIdx, nextK);

const fnU = eval('(function(){ const T = {}; ' + uDef + '; return T.u; })()');
const fnK = eval('(function(){ const T = {}; ' + kDef + '; return T.k; })()');

const startIdx = content.indexOf('openUserSettings:()=>A');
const sub = content.slice(startIdx, startIdx + 30000);
const promiseAllMatch = sub.match(/await Promise\.all\(\[([\s\S]+?)\]\)/);

if (promiseAllMatch) {
  const chunkIds = Array.from(promiseAllMatch[1].matchAll(/n\.e\("(\d+)"\)/g)).map(m => m[1]);
  console.log('Total chunk IDs in openUserSettings:', chunkIds.length);
  
  const existing = new Set(fs.readdirSync('discord-assets/assets'));
  let missingJs = 0;
  let missingCss = 0;
  
  for (const id of chunkIds) {
    const js = fnU(id);
    if (js && !js.endsWith('undefined.js')) {
      if (!existing.has(js)) missingJs++;
    }
    const css = fnK(id);
    if (css && !css.endsWith('undefined.css')) {
      if (!existing.has(css)) missingCss++;
    }
  }

  console.log('Missing JS chunks for User Settings:', missingJs);
  console.log('Missing CSS chunks for User Settings:', missingCss);
}
