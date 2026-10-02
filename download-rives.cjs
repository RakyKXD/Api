const https = require('https');
const fs = require('fs');
const path = require('path');

const dir1 = path.resolve('discord-assets/assets/content');
const dir2 = path.resolve('public/assets/content');
fs.mkdirSync(dir1, { recursive: true });
fs.mkdirSync(dir2, { recursive: true });

const list = JSON.parse(fs.readFileSync('all-rive-files.json', 'utf8'));

async function downloadRive(filename) {
  const p1 = path.join(dir1, filename);
  const p2 = path.join(dir2, filename);
  if (fs.existsSync(p1) && fs.statSync(p1).size > 0) return { filename, cached: true };

  return new Promise((resolve) => {
    https.get('https://cdn.discordapp.com/assets/content/' + filename, (res) => {
      if (res.statusCode === 200) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          fs.writeFileSync(p1, buf);
          fs.writeFileSync(p2, buf);
          resolve({ filename, status: 200, size: buf.length });
        });
      } else {
        res.resume();
        resolve({ filename, status: res.statusCode });
      }
    }).on('error', err => {
      resolve({ filename, status: 'error', error: err.message });
    });
  });
}

async function run() {
  console.log(`Downloading ${list.length} Rive files...`);
  for (const f of list) {
    const res = await downloadRive(f);
    console.log(f.slice(0, 16) + '...:', res.status || 'cached', res.size ? `(${res.size}b)` : '');
  }
  console.log('Rive download complete!');
}

run();
