const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('public/assets/web.d4c7976eccf337f1.js', 'utf8');
const uIdx = content.indexOf('T.u=');
const uEnd = content.indexOf('})[e]+".js"', uIdx) + 11;
const fnCode = content.slice(uIdx + 4, uEnd);
const getFilename = new Function('return (' + fnCode + ')')();

const regex = /"es-ES":\(\)=>n\.e\("([^"]+)"\)\.then\(n\.(?:t\.)?bind\(n,(\d+)(?:,\d+)?\)\)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const chunkId = match[1];
  const moduleId = match[2];
  const filename = getFilename(chunkId);
  const p = path.join('public', 'assets', filename);
  const text = fs.readFileSync(p, 'utf8');
  const hasModule = text.includes(moduleId);
  const hasChunk = text.includes(chunkId);
  console.log(`Chunk ${chunkId} -> file ${filename} (${text.length}b): hasModule(${moduleId})=${hasModule}, hasChunk=${hasChunk}`);
  if (!hasModule) {
    console.log(`   Sample of ${filename}:`, text.slice(0, 150));
  }
}
