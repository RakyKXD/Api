const fs = require('fs');
const http = require('http');

const content = fs.readFileSync('./public/assets/web.d4c7976eccf337f1.js', 'utf8');

// Find installed chunks map
const instIdx = content.indexOf('35328:0,358404:0');
const instStart = content.lastIndexOf('{', instIdx);
const instEnd = content.indexOf('}', instIdx) + 1;
const installedMap = eval('(' + content.substring(instStart, instEnd) + ')');

const uStart = content.indexOf('.u=e=>');
const marker = '})[e]+".js"';
const uEnd = content.indexOf(marker, uStart) + marker.length;
const resolveJs = new Function('e', 'return (' + content.substring(uStart + 6, uEnd) + ')');

const kStart = content.indexOf('.k=e=>');
const kMarker = '})[e]+".css"';
const kEnd = content.indexOf(kMarker, kStart) + kMarker.length;
const resolveCss = new Function('e', 'return (' + content.substring(kStart + 6, kEnd) + ')');

// Extract all chunk IDs for openModalLazy
const start = content.indexOf('openModalLazy', 8192000);
const thenIdx = content.indexOf('.then(n.bind(n,', start);
const slice = content.substring(start, thenIdx);

const chunkIds = [];
const re = /n\.e\("([^"]+)"\)/g;
let m;
while ((m = re.exec(slice)) !== null) {
  chunkIds.push(m[1]);
}

const jRegexMatch = content.slice(content.indexOf('T.f.j='), content.indexOf('T.f.j=') + 5000).match(/else if\((\/\^.*?\/)\.test\(e\)\)/);
const jRegex = eval(jRegexMatch[1]);

const filesToFetch = new Set();

for (const id of chunkIds) {
  if (installedMap[id] === 0) continue;
  if (jRegex.test(id)) {
    // Handled synthetically by A[e]=0
    continue;
  }
  const jsFile = resolveJs(id);
  if (jsFile && !jsFile.includes('undefined')) {
    filesToFetch.add(jsFile);
  }
  const cssFile = resolveCss(id);
  if (cssFile && !cssFile.includes('undefined')) {
    filesToFetch.add(cssFile);
  }
}

console.log('Total files that Promise.all needs to fetch:', filesToFetch.size);

// Check if all files exist in public/assets
const missingFromDisk = [];
for (const file of filesToFetch) {
  if (!fs.existsSync('./public/assets/' + file)) {
    missingFromDisk.push(file);
  }
}

console.log('Missing from ./public/assets:', missingFromDisk.length);
if (missingFromDisk.length > 0) {
  console.log('First 20 missing files:', missingFromDisk.slice(0, 20));
}
